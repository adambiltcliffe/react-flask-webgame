import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, send_from_directory, session, redirect, request
from flask_socketio import SocketIO, emit
from game import Game
app = Flask(__name__)
app.secret_key = 'probably load this from a config file later'
socketio = SocketIO(app)

game = Game('albus', 'bungo')
sids = {}

@app.route('/')
@app.route('/play')
def game_app_page():
    return send_from_directory('dist', 'app.html')

@app.route('/testlogin/<username>')
def create_test_login(username):
  session['username'] = username
  return redirect('/play')

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
  emit('update', game.get_user_view(session['username']))

@socketio.on('disconnect')
def disconnect_user():
  del sids[request.sid]

@socketio.on('make_move')
def test_message(data):
  if 'move' in data:
    if game.make_move(session['username'], data['move']):
      for sid, username in sids.items():
        gs = game.get_user_view(username)
        socketio.emit('update', gs, room=sid)
    else:
      pass # tried to make invalid move

if __name__ == '__main__':
    socketio.run(app)
