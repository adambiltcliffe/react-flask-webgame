import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, send_from_directory, session, redirect
from flask_socketio import SocketIO, emit
from game import Game
app = Flask(__name__)
app.secret_key = 'probably load this from a config file later'
socketio = SocketIO(app)

game = Game()

@app.route('/')
def main_page():
    return send_from_directory('dist', 'app.html')

@app.route('/testlogin/<username>')
def create_test_login(username):
  session['username'] = username
  return redirect('/')

@app.route('/bundled-assets/<filename>')
def bundled_assets(filename):
  return send_from_directory('dist', filename)

@socketio.on('connect')
def send_board():
  if not 'username' in session:
    session['username'] = 'anonymous'
  emit('identify', session['username'])
  emit('update', game.state)

@socketio.on('make_move')
def test_message(data):
  if 'move' in data:
    game.make_move(data['move']) # should validate somewhere
  socketio.emit('update', game.state)

if __name__ == '__main__':
    socketio.run(app)
