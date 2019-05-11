import eventlet
eventlet.monkey_patch()

from collections import defaultdict
from functools import wraps

from flask import (Flask, g, jsonify, redirect, render_template,
                    request, send_from_directory)
from flask_jwt_extended import JWTManager, create_access_token, decode_token
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from jwt import DecodeError, ExpiredSignatureError
from mongoengine import DoesNotExist, connect
from werkzeug.local import LocalProxy

from db.user import User, get_guest
from game import ExampleCardGame, SquareSubtractionGame, IllegalAction
from game.config import IllegalConfig

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'this should also be in a config file'
socketio = SocketIO(app)
jwt = JWTManager(app)

connect('webgame', host='127.0.0.1', port=27017)

def make_user(login, nickname):
    u = User.objects(test_login=login).upsert_one(set__nickname=nickname)
    u.save()
    return u
albus = make_user('test-albus', 'Albus Dumbledore')
bungo = make_user('test-bungo', 'Mr Bungo')
conan = make_user('test-conan', 'Conan the Barbarian')

next_game_id = [1]
games = {}
def make_game(c, user1, user2=None, config_args={}):
    gameid = str(next_game_id[0])
    g = c(gameid, config_args)
    g.add_player(user1)
    if user2 is not None:
        g.add_player(user2)
        g.start()
    games[gameid] = g
    next_game_id[0] += 1
    return g
make_game(ExampleCardGame, albus, bungo)
make_game(ExampleCardGame, albus, conan)
make_game(SquareSubtractionGame, conan, bungo, config_args={'starting_number': 35})
make_game(ExampleCardGame, conan)

class Conn(object):
    def __init__(self, encoded_token):
        self.update_token(encoded_token)
    def update_token(self, encoded_token):
        if encoded_token is None or encoded_token == 'null':
            self.last_token = None
        else:
            try:
                self.last_token = decode_token(encoded_token)
            except DecodeError:
                emit('client_error', 'Could not decode access token.')
                self.last_token = None
            except ExpiredSignatureError:
                emit('client_error', 'Access token has expired.')
                self.last_token = None
conns = {}

def check_user(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.sid in conns:
            token = conns[request.sid].last_token
            if token is None:
                g.user = get_guest() # anonymous user
            else:
                try:
                    g.user = User.objects.get(test_login=token['identity'])
                except DoesNotExist:
                    emit('client_error', 'Token identity not valid.')
            return f(*args, **kwargs)
        else:
            emit('client_error', 'Not authenticated.')
    return wrapper

user = LocalProxy(lambda: g.user)

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
    test_login = f'test-{name}'
    user = User.objects(test_login=test_login).upsert_one(set_on_insert__nickname=name)
    user.save()
    token = create_access_token(identity=str(user.id), user_claims={'nickname': user.nickname})
    return jsonify(access_token=token), 200

@app.route('/bundled-assets/<filename>')
def bundled_assets(filename):
  return send_from_directory('dist', filename)

@socketio.on('connect')
def connect_new_lobby_user():
    c = Conn(request.args.get("token"))
    conns[request.sid] = c
    print(f"{request.sid} connected, token is {conns[request.sid].last_token}")

@socketio.on('token')
def new_token(encoded_token):
    c = conns[request.sid]
    c.update_token(encoded_token)
    print(f"{request.sid} sent new token, token is {conns[request.sid].last_token}")
    for room in rooms():
        if room != request.sid:
            print(f'Removing client from {room}')
            leave_room(room)

@socketio.on('disconnect')
def disconnect_user():
  del conns[request.sid]
  print(f"{request.sid} disconnected")

# Now handlers for actually doing stuff

@socketio.on('open_lobby')
@check_user
def send_lobby_state_add_to_room():
  gamelist = {gameid: games[gameid].get_lobby_info() for gameid in games}
  emit('games_list', {'gamelist': gamelist})
  join_room('lobby')

@socketio.on('close_lobby')
@check_user
def close_lobby():
  leave_room('lobby')

@socketio.on('create_game')
@check_user
def create_game(data):
    gametype = data.get('gametype')
    if gametype != 'subtract_square' and gametype != 'example_card':
        emit('client_error', 'Unknown game type.')
    else:
        if user.is_anonymous:
            emit('client_alert', 'You must be logged in to create a game.')
        elif not user_can_join_game(user):
            emit('client_alert', "You can't create a game while waiting for another game to start.")
        else:
            gclass = {'subtract_square': SquareSubtractionGame, 'example_card': ExampleCardGame}[gametype]
            config_args = data.get('config_args', {})
            try:
                game = make_game(gclass, user._get_current_object(), config_args=config_args)
                emit_lobby_update(game.config.gameid)
                notify_game_available(game)
            except IllegalConfig as e:
                emit('client_alert', f"The game couldn't be created. {e}")

@socketio.on('join_game')
@check_user
def join_game(data):
    gameid = data.get('gameid', None)
    print('open_game: ' + repr(gameid))
    if gameid is not None and gameid in games:
        game = games[gameid]
        if user.is_anonymous:
            emit('client_alert', 'You must be logged in to join a game.')
        elif game.has_player(user):
            emit('client_alert', 'You have already joined that game.')
        elif game.status not in ('WAIT', 'READY'):
            emit('client_alert', 'That game has already started.')
        elif game.full:
            emit('client_alert', 'That game is full.')
        elif not user_can_join_game(user):
            emit('client_alert', "You can't join a game while waiting for another game to start.")
        else:
            game.add_player(user._get_current_object())
            emit_lobby_update(gameid)
            emit_pregame_updates(gameid)
            notify_game_available(game)
    else:
        emit('client_error', 'Bad game ID when joining game.')

@socketio.on('leave_game')
@check_user
def leave_game(data):
    gameid = data.get('gameid', None)
    print('leave_game: ' + repr(gameid))
    if gameid is not None and gameid in games:
        game = games[gameid]
        if not game.has_player(user):
            emit('client_alert', 'You have not joined that game.')
        elif game.status not in ('WAIT', 'READY'):
            emit('client_alert', 'That game has already started.')
        else:
            game.remove_player(user._get_current_object())
            channel = game.get_channel_for_user(user)
            leave_room(channel)
            emit_lobby_update(gameid)
            if game.config.players:
                emit_pregame_updates(gameid)
                start_game_if_ready(games[gameid])
            else:
                del games[gameid]
    else:
        emit('client_error', 'Bad game ID when leaving game.')

@socketio.on('open_game')
@check_user
def send_game_state_add_to_room(data):
  gameid = data.get('gameid', None)
  print('open_game: ' + repr(gameid))
  if gameid is not None and gameid in games:
    game = games[gameid]
    channel = game.get_channel_for_user(user)
    if game.status == 'WAIT' or game.status == 'READY':
        if game.has_player(user):
            join_room(channel)
            emit('update_pregame', game.get_pregame_update(user))
        else:
            emit('client_error', "Game not started.")
    else:
        join_room(channel)
        emit('update_full', game.get_full_update(user))
    print(f"{user.id} subscribed to game {gameid} ({channel})")
  else:
    emit('client_error', 'Bad game ID when opening game.')

@socketio.on('close_game')
@check_user
def close_game(data):
  gameid = data.get('gameid', None)
  if gameid is not None and gameid in games:
    game = games[gameid]
    channel = game.get_channel_for_user(user)
    leave_room(channel)
    # We don't give an error if the gameid is bad since maybe the game was just deleted

@socketio.on('ready')
@check_user
def ready(data):
    print(f"{user.id} sent ready data: {data}")
    gameid = data.get('gameid', None)
    if gameid is None or gameid not in games:
        emit('client_error', 'Bad game ID when submitting pregame data.')
    elif 'opts' not in data:
        emit('client_error', 'Missing action data.')
    else:
        stored_opts = games[gameid].get_player_opts(user)
        for k in data['opts']:
            stored_opts[k] = data['opts'][k]
        emit_pregame_updates(gameid)
        start_game_if_ready(games[gameid])

@socketio.on('game_action')
@check_user
def game_action(data):
  print(f"{user.id} sent action data: {data}")
  gameid = data.get('gameid', None)
  if gameid is None or gameid not in games:
    emit('client_error', 'Bad game ID when submitting action.')
  elif 'action' not in data:
    emit('client_error', 'Missing action data.')
  else:
    try:
      for channel, message_type, data in games[gameid].handle_action(user, data['action']):
        socketio.emit(message_type, data, room=channel)
      emit_lobby_update(gameid)
    except IllegalAction:
      emit('client_error', f'Illegal action data: {data}')

def user_can_join_game(user):
    for g in games.values():
        if g.has_player(user) and (g.status == 'WAIT' or g.status == 'READY'):
            return False
    return True

def notify_game_available(game):
    emit('game_available', {'gameid': game.config.gameid})

def emit_lobby_update(gameid):
    if games[gameid].config.players:
        socketio.emit('game_status', {'gameid': gameid, 'status': games[gameid].get_lobby_info()}, room='lobby')
    else:
        socketio.emit('game_status', {'gameid': gameid, 'status': None}, room='lobby')

def emit_pregame_updates(gameid):
    for channel, message_type, data in games[gameid].get_pregame_updates():
        print(channel, message_type, data)
        socketio.emit(message_type, data, room=channel)

def start_game_if_ready(game):
    if game.can_start():
        game.start()
        emit_lobby_update(game.config.gameid)
        for channel, message_type, data in game.get_full_updates():
            socketio.emit(message_type, data, room=channel)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
