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
usernames = {}
listeners = defaultdict(set)

@app.route('/play')
def default_play():
  return redirect('/play/lobby')

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

# /lobby namespace
@socketio.on('connect', namespace='/lobby')
def connect_new_lobby_user():
  if not 'username' in session:
    session['username'] = 'anonymous'
  usernames[request.sid] = session['username']
  print(f"{request.sid} ({session['username']}) connected to lobby")
  print(request.args.get("foo"))
  gamelist = {gameid: games[gameid].get_lobby_view() for gameid in games}
  emit('games_list', {'gamelist': gamelist})

@socketio.on('disconnect', namespace='/lobby')
def disconnect_lobby_user():
  username = usernames[request.sid]
  del usernames[request.sid]
  print(f'{request.sid} ({username}) disconnected from lobby')

# /game namespace
@socketio.on('connect', namespace='/game')
def connect_new_user():
  if not 'username' in session:
    session['username'] = 'anonymous'
  usernames[request.sid] = session['username']
  print(f"{request.sid} ({session['username']}) connected to game")

@socketio.on('disconnect', namespace='/game')
def disconnect_user():
  username = usernames[request.sid]
  del usernames[request.sid]
  for ls in listeners.values():
    ls.discard(request.sid)
  print(f'{request.sid} ({username}) disconnected from game')

@socketio.on('open_game', namespace='/game')
def send_game_state_add_listener(data):
  print(request.sid, 'load_game', data)
  gameid = data.get('gameid', None)
  if gameid is not None and gameid in games:
    emit('update', {'gameid': gameid, 'state': games[gameid].get_user_view(usernames[request.sid])})
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
  gameid = data.get('gameid', None)
  if gameid is not None and gameid in games:
    game = games[gameid]
    if 'move' in data and game.make_move(session['username'], data['move']):
      for sid in listeners[gameid]:
        gs = game.get_user_view(usernames[sid])
        socketio.emit('update', {'gameid': gameid, 'state': gs}, room=sid, namespace='/game')
      socketio.emit('game_status', {'gameid': gameid, 'status': game.get_lobby_view()}, broadcast=True, namespace='/lobby')
    else:
      # Should handle the case where it was a valid move for a recent state
      emit('client_error', f'Invalid move data. {data}')
  else:
    emit('client_error', 'Bad game ID.')

if __name__ == '__main__':
    socketio.run(app)
