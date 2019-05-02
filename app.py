import eventlet
eventlet.monkey_patch()

from collections import defaultdict

from flask import (Flask, jsonify, redirect, render_template, request,
                   send_from_directory)
from flask_jwt_extended import JWTManager, create_access_token, decode_token
from flask_socketio import SocketIO, emit, join_room, leave_room
from jwt import DecodeError

from db.user import User
from game import ExampleCardGame, SquareSubtractionGame, IllegalAction
from game.config import IllegalConfig

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'this should also be in a config file'
socketio = SocketIO(app)
jwt = JWTManager(app)

users = {}
def make_user(userid, nickname):
    u = User(userid, nickname)
    users[userid] = u
make_user('test-albus', 'Albus Dumbledore')
make_user('test-bungo', 'Mr Bungo')
make_user('test-conan', 'Conan the Barbarian')

next_game_id = [1]
games = {}
def make_game(c, user1, user2=None, config_args={}):
    gameid = str(next_game_id[0])
    g = c(gameid, config_args)
    g.add_player(user1.id, user1.nickname)
    if user2 is not None:
        g.add_player(user2.id, user2.nickname)
        g.start()
    games[gameid] = g
    next_game_id[0] += 1
    return gameid
make_game(ExampleCardGame, users['test-albus'], users['test-bungo'])
make_game(ExampleCardGame, users['test-albus'], users['test-conan'])
make_game(SquareSubtractionGame, users['test-conan'], users['test-bungo'], config_args={'starting_number': 35})
make_game(ExampleCardGame, users['test-conan'])

class Conn(object):
  def __init__(self, encoded_token):
    if encoded_token is None or encoded_token == 'null':
      self.token = None
      self.identity = 'anonymous'
    else:
      self.token = decode_token(encoded_token)
      self.identity = self.token['identity']
conns = {}

@app.route('/play')
def default_play():
  return redirect('/play/lobby')

@app.route('/play/lobby')
@app.route('/play/game/<gameid>')
def game_app_page(**_):
    return send_from_directory('dist', 'app.html')

@app.route('/testlogin', methods=['POST'])
def test_login():
    if not request.is_json:
        return jsonify({'msg': 'Missing JSON in request', 'err': True}), 400
    name = request.json.get('name', None)
    if not name:
        return jsonify({'msg': 'No name provided', 'err': True}), 400
    userid = f'test-{name}'
    if not userid in users:
        users[userid] = User(userid, name) # create user
    user = users[userid]
    token = create_access_token(identity=user.id, user_claims={'nickname': user.nickname})
    return jsonify(access_token=token), 200

@app.route('/bundled-assets/<filename>')
def bundled_assets(filename):
  return send_from_directory('dist', filename)

# /lobby namespace
@socketio.on('connect')
def connect_new_lobby_user():
  conns[request.sid] = Conn(request.args.get("token"))
  identity = conns[request.sid].identity
  print(f"{identity} connected")

@socketio.on('disconnect')
def disconnect_user():
  identity = conns[request.sid].identity
  del conns[request.sid]
  print(f"{identity} disconnected")

@socketio.on('open_lobby')
def send_lobby_state_add_to_room():
  gamelist = {gameid: games[gameid].get_lobby_info() for gameid in games}
  emit('games_list', {'gamelist': gamelist})
  join_room('lobby')

@socketio.on('close_lobby')
def close_lobby():
  leave_room('lobby')

@socketio.on('create_game')
def create_game(data):
    gametype = data.get('gametype')
    if gametype != 'subtract_square' and gametype != 'example_card':
        emit('client_error', 'Unknown game type.')
    else:
        identity = conns[request.sid].identity
        if identity == 'anonymous':
            emit('client_alert', 'You must be logged in to create a game.')
        else:
            gclass = {'subtract_square': SquareSubtractionGame, 'example_card': ExampleCardGame}[gametype]
            config_args = data.get('config_args', {})
            try:
                emit_lobby_update(make_game(gclass, identity, config_args=config_args))
            except IllegalConfig as e:
                emit('client_alert', f"The game couldn't be created. {e}")

@socketio.on('join_game')
def join_game(data):
    gameid = data.get('gameid', None)
    print('open_game: ' + repr(gameid))
    if gameid is not None and gameid in games:
        identity = conns[request.sid].identity
        game = games[gameid]
        if identity in game.config.players:
            emit('client_alert', 'You have already joined that game.')
        elif game.status not in ('WAIT', 'READY'):
            emit('client_alert', 'That game has already started.')
        elif game.full:
            emit('client_alert', 'That game is full.')
        else:
            game.add_player(identity, users[identity].nickname)
            emit_lobby_update(gameid)
            # this bit is temporary
            if game.full:
                game.start()
                emit_lobby_update(gameid)
                for sid, conn in conns.items():
                    if conn.identity in game.config.players:
                        socketio.emit('client_alert', 'Your game has started.', room=sid)
    else:
        emit('client_error', 'Bad game ID.')

@socketio.on('open_game')
def send_game_state_add_to_room(data):
  gameid = data.get('gameid', None)
  print('open_game: ' + repr(gameid))
  if gameid is not None and gameid in games:
    game = games[gameid]
    if game.status in ('WAIT', 'READY'):
        emit('client_error', 'Game not started.')
    else:
        identity = conns[request.sid].identity
        channel = game.get_channel_for_user(identity)
        join_room(channel)
        emit('update_full', game.get_full_update(identity))
        print(f"{identity} subscribed to game {gameid} ({channel})")
  else:
    emit('client_error', 'Bad game ID.')

@socketio.on('close_game')
def close_game(data):
  gameid = data.get('gameid', None)
  if gameid is not None and gameid in games:
    game = games[gameid]
    identity = conns[request.sid].identity
    channel = game.get_channel_for_user(identity)
    leave_room(channel)
  else:
    emit('client_error', 'Bad game ID.')

@socketio.on('game_action')
def game_action(data):
  identity = conns[request.sid].identity
  print(f"{identity} sent action data: {data}")
  gameid = data.get('gameid', None)
  if gameid is None or gameid not in games:
    emit('client_error', 'Bad game ID.')
  elif 'action' not in data:
    emit('client_error', 'Missing action data.')
  else:
    try:
      for channel, message_type, data in games[gameid].handle_action(conns[request.sid].identity, data['action']):
        socketio.emit(message_type, data, room=channel)
      emit_lobby_update(gameid)
    except IllegalAction:
      emit('client_error', f'Illegal action data: {data}')

def emit_lobby_update(gameid):
    socketio.emit('game_status', {'gameid': gameid, 'status': games[gameid].get_lobby_info()}, room='lobby')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
