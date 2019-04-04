import eventlet
eventlet.monkey_patch()

from collections import defaultdict

from flask import (Flask, jsonify, redirect, render_template, request,
                   send_from_directory)
from flask_jwt_extended import JWTManager, create_access_token, decode_token
from flask_socketio import SocketIO, emit, join_room
from jwt import DecodeError

from game import Game

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'this should also be in a config file'
socketio = SocketIO(app)
jwt = JWTManager(app)

users = {'test-albus': 'Albus', 'test-bungo': 'BUNGO', 'test-conan': 'Conan the Destroyer'}
next_game_id = [1]
games = {}
def make_game(id1, id2):
  g = Game(next_game_id[0])
  g.add_player(id1, users[id1])
  g.add_player(id2, users[id2])
  g.start()
  games[str(next_game_id[0])] = g
  next_game_id[0] += 1
make_game('test-albus', 'test-bungo')
make_game('test-albus', 'test-conan')
make_game('test-conan', 'test-bungo')
print(games)

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
@socketio.on('connect', namespace='/lobby')
def connect_new_lobby_user():
  conns[request.sid] = Conn(request.args.get("token"))
  identity = conns[request.sid].identity
  print(f"{identity} connected to lobby namespace")
  gamelist = {gameid: games[gameid].get_lobby_view() for gameid in games}
  emit('games_list', {'gamelist': gamelist})

@socketio.on('disconnect', namespace='/lobby')
def disconnect_lobby_user():
  identity = conns[request.sid].identity
  del conns[request.sid]
  print(f"{identity} disconnected from lobby namespace")

# /game namespace
@socketio.on('connect', namespace='/game')
def connect_new_user():
  conns[request.sid] = Conn(request.args.get("token"))
  identity = conns[request.sid].identity
  print(f"{identity} connected to game namespace")

@socketio.on('disconnect', namespace='/game')
def disconnect_user():
  identity = conns[request.sid].identity
  del conns[request.sid]
  print(f"{identity} disconnected from game namespace")

@socketio.on('open_game', namespace='/game')
def send_game_state_add_to_room(data):
  gameid = data.get('gameid', None)
  print(gameid, games)
  if gameid is not None and gameid in games:
    game = games[gameid]
    identity = conns[request.sid].identity
    channel = game.get_channel_for_user(identity)
    join_room(channel)
    emit('update', {'gameid': gameid, 'state': game.get_user_view(identity)})
    print(f"{identity} subscribed to game {gameid} ({channel})")
  else:
    emit('client_error', 'Bad game ID.')

@socketio.on('make_move', namespace='/game')
def test_message(data):
  print(request.sid, data)
  gameid = data.get('gameid', None)
  if gameid is not None and gameid in games:
    game = games[gameid]
    if 'move' in data and game.make_move(conns[request.sid].identity, data['move']):
      for room, gv in game.get_channel_views():
        socketio.emit('update', {'gameid': gameid, 'state': gv}, room=room, namespace='/game')
        print(f'emitting on {room}')
      socketio.emit('game_status', {'gameid': gameid, 'status': game.get_lobby_view()}, broadcast=True, namespace='/lobby')
    else:
      # Should handle the case where it was a valid move for a recent state
      emit('client_error', f'Invalid move data. {data}')
  else:
    emit('client_error', 'Bad game ID.')

if __name__ == '__main__':
    socketio.run(app)
