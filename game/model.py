import jsonobject as jo
import random
from collections import Counter
from game.config import GameConfig

class BaseModel(jo.JsonObject):
    # game.status can also be WAIT or READY but in those situations a model does not exist
    config = jo.ObjectProperty(GameConfig)
    result = jo.DefaultProperty(required=False, exclude_if_none=True)
    def __init__(self, config):
        super(BaseModel, self).__init__(config = config, result=None)
    @property
    def status(self):
        return 'PLAY' if self.result is None else 'END'
    def get_start_message(self):
        return 'Game started.'
    def get_lobby_view(self):
        return {'gameid': self.config.gameid,
                'game_type': self.config.game_type,
                'players': self.turn_order.copy(),
                'playernicks': self.config.playernicks.copy()}
    def get_public_view(self):
        raise NotImplementedError()
    def get_player_view(self, userid):
        raise NotImplementedError()

class TurnBasedModel(BaseModel):
    turn_order = jo.ListProperty(jo.StringProperty())
    active_player_index = jo.IntegerProperty()
    def __init__(self, config):
        super(TurnBasedModel, self).__init__(config)
        self.turn_order = config.players[:]
        self.setup()
    def setup(self):
        random.shuffle(self.turn_order)
        self.active_player_index = 0
    def get_start_message(self):
        return f'Game started. {self.active_usernick} plays first.'
    @property
    def active_userid(self):
        return self.turn_order[self.active_player_index]
    @property
    def active_usernick(self):
        return self.config.playernicks[self.active_userid]
    def get_actions(self, userid):
        if self.result is not None:
            yield 'restart'
        else:
            if userid == self.active_userid:
                yield from self.get_actions_for_active_player()
    def get_actions_for_active_player(self):
        raise NotImplementedError()
    def is_legal_action(self, userid, action):
        return action in self.get_actions(userid) # TODO cache result of this to avoid repeat call
    def apply_action(self, userid, action, log_callback):
        if not self.is_legal_action(userid, action):
            return False
        if action == 'restart':
            self.result = None
            self.setup()
            log_callback(f'New game starting. {self.active_usernick} plays first.')
        else:
            self.apply_action_for_active_player(action, log_callback)
        # self.update_legal_actions()
    def apply_action_for_active_player(self, action, log_callback):
        raise NotImplementedError()
    def advance_turn(self):
        self.active_player_index = (self.active_player_index + 1) % len(self.turn_order)
    def get_lobby_view(self):
        result = super(TurnBasedModel, self).get_lobby_view()
        result['turn'] = self.active_userid
        return result
    def get_public_view(self):
        result = self.get_lobby_view()
        result['result'] = self.result
        return result
    def get_player_view(self, userid):
        result = self.get_public_view()
        result['my_player_index'] = self.turn_order.index(userid)
        result['my_moves'] = list(self.get_actions(userid)) # should be handled elsewhere eventually
        return result

class SquareSubtractionModel(TurnBasedModel):
    number = jo.IntegerProperty()
    def setup(self):
        self.number = 30
        super(SquareSubtractionModel, self).setup()
    def get_actions_for_active_player(self):
        n = 1
        while n ** 2 <= self.number:
            yield n**2
            n += 1
    def apply_action_for_active_player(self, move, log_callback):
        self.number -= int(move)
        log_callback(f'{self.active_usernick} chooses {move}.')
        if self.number == 0:
            self.result = {'winner': self.active_userid}
            log_callback(f'{self.active_usernick} wins!')
        self.advance_turn()
    def get_public_view(self):
        result = super(SquareSubtractionModel, self).get_public_view()
        result['number'] = self.number
        return result

class ExampleCardGameModel(TurnBasedModel):
    hands = jo.DefaultProperty()
    deck = jo.ListProperty(jo.IntegerProperty())
    stack = jo.ListProperty(jo.IntegerProperty())
    viewing = jo.ListProperty(jo.IntegerProperty(), required=False)
    @property
    def current_total(self):
        return sum(self.stack)
    def setup(self):
        cards = list(range(1,6)) * 5
        random.shuffle(cards)
        self.hands = {}
        self.hands[self.config.players[0]] = cards[0:5]
        self.hands[self.config.players[1]] = cards[5:10]
        self.deck = cards[10:]
        self.stack = []
        self.viewing = None
        super(ExampleCardGameModel, self).setup()
    def get_actions_for_active_player(self):
        if self.viewing:
            yield from [['pick', n] for n in sorted(set(self.viewing))]
        else:
            yield from [['play', n] for n in sorted(set(self.hands[self.active_userid]))]
            c = Counter(self.hands[self.active_userid])
            for v in c:
                if c[v] > 1:
                    yield ['discard_double', v]
    def apply_action_for_active_player(self, action, log_callback):
        move_type = action[0]
        if move_type == 'play':
            self.stack.append(int(action[1]))
            log_callback(f'{self.active_usernick} plays a {action[1]}, making the total {self.current_total}.')
            self.hands[self.active_userid].remove(int(action[1]))
            if self.current_total == 21:
                self.result = {'winner': self.active_userid}
                log_callback(f'{self.active_usernick} wins by reaching 21.')
            elif self.current_total > 21:
                self.result = {'winner': self.turn_order[1 - self.active_player_index]}
                log_callback(f'{self.active_usernick} went over 21. {self.config.playernicks[self.result["winner"]]} wins.')
            else:
                self.hands[self.active_userid].append(self.deck.pop())
            self.advance_turn()
        elif move_type == 'discard_double':
            log_callback(f'{self.active_usernick} discards a pair of {action[1]}s.')
            self.hands[self.active_userid].remove(int(action[1]))
            self.hands[self.active_userid].remove(int(action[1]))
            self.viewing = self.deck[:5]
            self.deck = self.deck[5:]
        elif move_type == 'pick':
            log_callback(f'{self.active_usernick} chooses a card from the top five of the deck.')
            self.hands[self.active_userid].append(int(action[1]))
            self.viewing.remove(int(action[1]))
            random.shuffle(self.viewing)
            self.deck.extend(self.viewing)
            log_callback(f'{len(self.viewing)} cards are shuffled and placed on the bottom.')
            self.viewing = None
            self.advance_turn()
    def get_public_view(self):
        result = super(ExampleCardGameModel, self).get_public_view()
        result['current_total'] = self.current_total
        result['deck_count'] = len(self.deck)
        result['stack'] = self.stack.copy()
        result['hand_counts'] = {uid: len(self.hands[uid]) for uid in self.config.players}
        return result
    def get_player_view(self, userid):
        result = super(ExampleCardGameModel, self).get_player_view(userid)
        result['my_hand'] = self.hands[userid].copy()
        return result
