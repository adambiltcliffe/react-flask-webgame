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
    emit('response', {'status': 'ok', 'tally': state['tally']})

if __name__ == '__main__':
    socketio.run(app)
