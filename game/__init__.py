import random
from collections import Counter

class GameFullError(Exception):
    pass

class GameNotFullError(Exception):
    pass

class GameAlreadyStartedError(Exception):
    pass

class GameNotStartedError(Exception):
    pass

class BaseGame:
    min_players = 2
    max_players = 2
    def __init__(self, gameid):
        self.gameid = gameid
        self.started = False
        self.winner = None
        self.playerids = []
        self.playernicks = {}
    def add_player(self, userid, nick):
        if len(self.playerids) == self.max_players:
            raise GameFullError()
        if self.started:
            raise GameAlreadyStartedError()
        self.playerids.append(userid)
        self.playernicks[userid] = nick
    def start(self):
        if len(self.playerids) < self.min_players:
            raise GameNotFullError()
        self.started = True
    def get_channel_for_user(self, userid):
        if userid in self.playerids:
            return f'{self.gameid}-player-{userid}'
        else:
            return f'{self.gameid}-observers'
    def get_lobby_view(self):
        raise NotImplementedError()
    def get_user_view(self, userid):
        raise NotImplementedError()
    def get_channel_views(self):
        for uid in self.playerids + ['anonymous']:
            yield (self.get_channel_for_user(uid), self.get_user_view(uid))

class TurnBasedGame(BaseGame):
    def start(self, *args):
        super(TurnBasedGame, self).start(*args)
        self.turn_order = self.playerids[:]
        random.shuffle(self.turn_order)
        self.active_player_index = 0
        self.find_moves()
    @property
    def active_userid(self):
        return self.turn_order[self.active_player_index]
    @property
    def active_usernick(self):
        return self.playernicks[self.active_userid]
    def find_moves(self):
        if self.winner is not None:
            self.moves_for_player = {p: ['restart'] for p in self.playerids}
        else:
            self.moves_for_player = {p: [] for p in self.playerids}
            self.moves_for_player[self.active_userid] = list(self.find_moves_for_active_player())
    def find_moves_for_active_player(self):
        raise NotImplementedError()
    def make_move(self, userid, move):
        if move == 'restart':
            self.winner = None
            self.start()
            return True
        elif userid != self.active_userid:
            return False
        elif move not in self.moves_for_player[userid]:
            return False
        self.make_move_for_active_player(move)
        self.find_moves()
        #persist to database here
        return True
    def make_move_for_active_player(self, move):
        raise NotImplementedError()
    def advance_turn(self):
        self.active_player_index = (self.active_player_index + 1) % len(self.turn_order)
    def get_lobby_view(self):
        if not self.started:
            p = [self.playernicks[uid] for uid in self.playerids]
            return {'players': p, 'status': 'waiting'}
        p = [self.playernicks[uid] for uid in self.turn_order]
        status = 'active' if self.winner is None else 'finished'
        return {'players': p, 'turn': self.active_usernick, 'status': status}
    def get_user_view(self, userid):
        if not self.started:
            raise GameNotStartedError()
        view = self.get_lobby_view()
        try:
            idx = self.turn_order.index(userid)
        except ValueError:
            idx = None
        view['my_player_index'] = idx
        view['winner'] = self.winner
        if userid in self.moves_for_player:
            view['my_moves'] = self.moves_for_player[userid][:]
        else:
            view['my_moves'] = []
        return view

class SquareSubtractionGame(TurnBasedGame):
    min_players = 2
    max_players = 2
    def start(self, *args):
        self.number = 30
        super(SquareSubtractionGame, self).start()
    def find_moves_for_active_player(self):
        n = 1
        while n ** 2 <= self.number:
            yield n**2
            n += 1
    def make_move_for_active_player(self, move):
        self.number -= int(move)
        if self.number == 0:
            self.winner = self.active_userid
        self.advance_turn()
    def get_user_view(self, userid):
        result = super(SquareSubtractionGame, self).get_user_view(userid)
        result['number'] = self.number
        return result

class SimpleCardGame(TurnBasedGame):
    min_players = 2
    max_players = 2
    def start(self, *args):
        cards = list(range(1,6)) * 5
        random.shuffle(cards)
        self.hands = {}
        self.hands[self.playerids[0]] = cards[0:5]
        self.hands[self.playerids[1]] = cards[5:10]
        self.deck = cards[10:]
        self.current_total = 0
        self.viewing = None
        super(SimpleCardGame, self).start()
    def find_moves_for_active_player(self):
        if self.viewing:
            yield from [['pick', n] for n in sorted(set(self.viewing))]
        else:
            yield from [['play', n] for n in sorted(set(self.hands[self.active_userid]))]
            c = Counter(self.hands[self.active_userid])
            for v in c:
                if c[v] > 1:
                    yield ['discard double', v]
    def make_move_for_active_player(self, move):
        move_type = move[0]
        if move_type == 'play':
            self.current_total = self.current_total + int(move[1])
            self.hands[self.active_userid].remove(int(move[1]))
            if self.current_total == 21:
                self.winner = self.active_userid
            elif self.current_total > 21:
                self.winner = self.turn_order[1 - self.active_player_index]
            else:
                self.hands[self.active_userid].append(self.deck.pop())
            self.advance_turn()
        elif move_type == 'discard double':
            self.hands[self.active_userid].remove(int(move[1]))
            self.hands[self.active_userid].remove(int(move[1]))
            self.viewing = self.deck[:5]
            self.deck = self.deck[5:]
        elif move_type == 'pick':
            self.hands[self.active_userid].append(int(move[1]))
            self.viewing.remove(int(move[1]))
            random.shuffle(self.viewing)
            self.deck.extend(self.viewing)
            self.viewing = None
            self.advance_turn()
    def get_user_view(self, userid):
        result = super(SimpleCardGame, self).get_user_view(userid)
        result['current_total'] = self.current_total
        result['deck_count'] = len(self.deck)
        result['hand_counts'] = {self.playernicks[uid]: len(self.hands[uid]) for uid in self.playerids}
        if userid in self.playerids:
            result['my_hand'] = self.hands[userid]
        return result
