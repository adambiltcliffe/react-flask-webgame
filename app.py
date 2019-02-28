import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, send_from_directory, session, redirect, request
from flask_socketio import SocketIO, emit
from game import Game
app = Flask(__name__)
app.secret_key = 'probably load this from a config file later'
socketio = SocketIO(app)

games = {'1': Game('albus', 'bungo'), '2': Game('albus', 'conan'), '3': Game('conan', 'bungo')}
sids = {}

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

@socketio.on('connect')
def connect_new_user():
  print(request.sid)
  if not 'username' in session:
    session['username'] = 'anonymous'
  sids[request.sid] = session['username']
  emit('identify', session['username'])

@socketio.on('disconnect')
def disconnect_user():
  del sids[request.sid]

@socketio.on('load_game')
def send_game_state(data):
  print(request.sid, 'load_game', data)
  if 'gameid' in data and data['gameid'] in games:
    emit('update', games[data['gameid']].get_user_view(session['username']))
  else:
    emit('client_error', 'Bad game ID.')

@socketio.on('make_move')
def test_message(data):
  if 'gameid' in data and data['gameid'] in games:
    game = games[data['gameid']]
    if 'move' in data and game.make_move(session['username'], data['move']):
      for sid, username in sids.items():
        gs = game.get_user_view(username)
        socketio.emit('update', gs, room=sid)
    else:
      emit('client_error', f'Invalid move data. {data}')
  else:
    emit('client_error', 'Bad game ID.')

if __name__ == '__main__':
    socketio.run(app)
