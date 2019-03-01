import eventlet
eventlet.monkey_patch()

from collections import defaultdict

from flask import Flask, render_template, send_from_directory, session, redirect, request
from flask_socketio import SocketIO, emit
from game import Game
app = Flask(__name__)
app.secret_key = 'probably load this from a config file later'
socketio = SocketIO(app)

games = {'1': Game('albus', 'bungo'), '2': Game('albus', 'conan'), '3': Game('conan', 'bungo')}
sids = {}
listeners = defaultdict(set)

@app.route('/play/lobby')
@app.route('/play/game/<gameid>')
def game_app_page(**_):
    return send_from_directory('dist', 'app.html')

@app.route('/testlogin/<username>')
def create_test_login(username):
  session['username'] = username
  return redirect('/play/lobby')

@app.route('/bundled-assets/<filename>')
def bundled_assets(filename):
  return send_from_directory('dist', filename)

@socketio.on('connect', namespace='/game')
def connect_new_user():
  print(request.sid)
  if not 'username' in session:
    session['username'] = 'anonymous'
  sids[request.sid] = session['username']

@socketio.on('disconnect', namespace='/game')
def disconnect_user():
  del sids[request.sid]

@socketio.on('open_game', namespace='/game')
def send_game_state_add_listener(data):
  print(request.sid, 'load_game', data)
  gameid = data.get('gameid', None)
  if gameid is not None and gameid in games:
    emit('update', games[gameid].get_user_view(sids[request.sid]))
    listeners[gameid].add(request.sid)
  else:
    emit('client_error', 'Bad game ID.')

@socketio.on('close_game', namespace='/game')
def remove_listener(data):
  gameid = data.get('gameid', None)
  if gameid is not None and gameid in games:
    listeners[gameid].discard(request.sid)
  else:
    emit('client_error', 'Bad game ID.')

@socketio.on('make_move', namespace='/game')
def test_message(data):
  print(request.sid, data)
  if 'gameid' in data and data['gameid'] in games:
    game = games[data['gameid']]
    if 'move' in data and game.make_move(session['username'], data['move']):
      for sid, username in sids.items():
        # This sends the update to *every* connected user, whichever game they are playing
        # Super buggy!
        gs = game.get_user_view(username)
        socketio.emit('update', gs, room=sid, namespace='/game')
    else:
      emit('client_error', f'Invalid move data. {data}')
  else:
    emit('client_error', 'Bad game ID.')

if __name__ == '__main__':
    socketio.run(app)
