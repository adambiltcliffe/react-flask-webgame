import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template
from flask_socketio import SocketIO, emit
app = Flask(__name__)
socketio = SocketIO(app)

state = {'tally': 0}

@app.route('/')
def hello():
    return render_template('index.html')

@socketio.on('test')
def test_message(data):
    state['tally'] += 1
    emit('response', {'status': 'ok', 'tally': state['tally']})

if __name__ == '__main__':
    socketio.run(app)
