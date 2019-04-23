import eventlet
eventlet.monkey_patch()

from collections import defaultdict

from flask import (Flask, jsonify, redirect, render_template, request,
                   send_from_directory)
from flask_jwt_extended import JWTManager, create_access_token, decode_token
from flask_socketio import SocketIO, emit, join_room, leave_room
from jwt import DecodeError

from game import ExampleCardGame, SquareSubtractionGame, IllegalAction

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'this should also be in a config file'
socketio = SocketIO(app)
jwt = JWTManager(app)

users = {'test-albus': 'Albus Dumbledore', 'test-bungo': 'Mr Bungo', 'test-conan': 'Conan the Barbarian'}
next_game_id = [1]
games = {}
def make_game(c, id1, id2):
  g = c(next_game_id[0])
  g.add_player(id1, users[id1])
  if id2 is not None:
    g.add_player(id2, users[id2])
    g.start()
  games[str(next_game_id[0])] = g
  next_game_id[0] += 1
make_game(ExampleCardGame, 'test-albus', 'test-bungo')
make_game(ExampleCardGame, 'test-albus', 'test-conan')
make_game(SquareSubtractionGame, 'test-conan', 'test-bungo')
make_game(ExampleCardGame, 'test-conan', None)

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
    users[userid] = name # create user
  token = create_access_token(identity=userid, user_claims={'nickname': users[userid]})
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
            game.add_player(identity, users[identity])
            socketio.emit('game_status', {'gameid': gameid, 'status': games[gameid].get_lobby_info()}, room='lobby')
            # this bit is temporary
            if game.full:
                game.start()
                socketio.emit('game_status', {'gameid': gameid, 'status': games[gameid].get_lobby_info()}, room='lobby')
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
      socketio.emit('game_status', {'gameid': gameid, 'status': games[gameid].get_lobby_info()}, room='lobby')
    except IllegalAction:
      emit('client_error', f'Illegal action data: {data}')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
