import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit
app = Flask(__name__)
socketio = SocketIO(app)

state = {'tally': 0}

@app.route('/')
def main_page():
    return send_from_directory('dist', 'app.html')

@app.route('/bundled-assets/<filename>')
def bundled_assets(filename):
  return send_from_directory('dist', filename)

@socketio.on('test')
def test_message(data):
    state['tally'] += 1
    moves = ['pass']
    if state['tally'] % 3 == 0: moves.append('capitulate')
    if state['tally'] % 4 == 0: moves.append('redraw')
    if state['tally'] % 5 == 0: moves.append('ionize')
    emit('update', {'status': 'ok', 'score': state['tally'], 'sky': 'blue', 'moves': moves})

if __name__ == '__main__':
    socketio.run(app)
