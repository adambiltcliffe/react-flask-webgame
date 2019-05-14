import mongoengine as me
import random
from collections import Counter
from game.config import BaseConfig

class BaseModel(me.EmbeddedDocument):
    meta = {'allow_inheritance': True}
    # game.status can also be WAIT or READY but in those situations a model does not exist
    config = me.EmbeddedDocumentField(BaseConfig)
    result = me.DictField(required=False, default=None)
    @property
    def status(self):
        return 'PLAY' if self.result is None else 'END'
    def get_start_message(self):
        return 'Game started.'
    def get_public_view(self):
        raise NotImplementedError()
    def get_player_view(self, userid):
        raise NotImplementedError()

class TurnBasedModel(BaseModel):
    turn_order = me.ListField(me.ReferenceField('User'))
    active_player_index = me.IntField()
    def __init__(self, config):
        super(TurnBasedModel, self).__init__(config)
        self.turn_order = config.players[:]
        self.setup()
    def setup(self):
        random.shuffle(self.turn_order)
        self.active_player_index = 0
        self.update_legal_actions()
    def get_start_message(self):
        return f'Game started. {self.active_user.nickname} plays first.'
    @property
    def active_user(self):
        return self.turn_order[self.active_player_index]
    def update_legal_actions(self):
        self._cached_actions = {p.id: [] for p in self.config.players}
        self._cached_actions[self.active_user.id] = list(self.get_actions_for_active_player())
    def get_actions(self, user):
        return self._cached_actions[user.id]
    def get_actions_for_active_player(self):
        raise NotImplementedError()
    def is_legal_action(self, user, action):
        return action in self.get_actions(user) # TODO cache result of this to avoid repeat call
    def apply_action(self, user, action, log_callback):
        if not self.is_legal_action(user, action):
            return False
        else:
            self.apply_action_for_active_player(action, log_callback)
        self.update_legal_actions()
    def apply_action_for_active_player(self, action, log_callback):
        raise NotImplementedError()
    def advance_turn(self):
        self.active_player_index = (self.active_player_index + 1) % len(self.turn_order)
    def get_public_view(self):
        return {}
    def get_player_view(self, user):
        return self.get_public_view()

class SquareSubtractionModel(TurnBasedModel):
    number = me.IntField()
    def setup(self):
        self.number = self.config.starting_number
        super(SquareSubtractionModel, self).setup()
    def get_actions_for_active_player(self):
        n = 1
        while n ** 2 <= self.number:
            yield n**2
            n += 1
    def apply_action_for_active_player(self, move, log_callback):
        self.number -= int(move)
        log_callback(f'{self.active_user.nickname} chooses {move}.')
        if self.number == 0:
            self.result = {'winner': self.active_user.id}
            log_callback(f'{self.active_user.nickname} wins!')
        self.advance_turn()
    def get_public_view(self):
        result = super(SquareSubtractionModel, self).get_public_view()
        result['number'] = self.number
        return result

class ExampleCardGameModel(TurnBasedModel):
    hands = me.MapField(me.ListField(me.IntField))
    deck = me.ListField(me.IntField())
    stack = me.ListField(me.IntField())
    viewing = me.ListField(me.IntField(), required=False)
    @property
    def current_total(self):
        return sum(self.stack)
    def setup(self):
        cards_to_deal = 4 if self.config.use_special_cards else 5
        cards = list(range(1,6)) * 5
        random.shuffle(cards)
        self.hands = {}
        self.hands[self.config.players[0].id] = cards[0:cards_to_deal]
        self.hands[self.config.players[1].id] = cards[cards_to_deal:cards_to_deal * 2]
        self.deck = cards[cards_to_deal * 2:]
        if self.config.use_special_cards:
            for p in self.config.players:
                self.hands[p.id].append(self.config.player_opts[p.id].special_card)
        self.stack = []
        self.viewing = None
        super(ExampleCardGameModel, self).setup()
    def update_legal_actions(self):
        if self.result is not None:
            self._cached_actions = {p.id: [['restart']] for p in self.config.players}
        else:
            super(ExampleCardGameModel, self).update_legal_actions()
    def get_actions_for_active_player(self):
        if self.viewing:
            yield from [['pick', n] for n in sorted(set(self.viewing))]
        else:
            yield from [['play', n] for n in sorted(set(self.hands[self.active_user.id]))]
            c = Counter(self.hands[self.active_user.id])
            for v in c:
                if c[v] > 1:
                    yield ['discard_double', v]
    def apply_action(self, user, action, log_callback):
        if not self.is_legal_action(user, action):
            return False
        if action == ['restart']:
            self.result = None
            self.setup()
            log_callback(f'New game starting. {self.active_user.nickname} plays first.')
        else:
            self.apply_action_for_active_player(action, log_callback)
        self.update_legal_actions()
    def apply_action_for_active_player(self, action, log_callback):
        move_type = action[0]
        if move_type == 'play':
            self.stack.append(int(action[1]))
            log_callback(f'{self.active_user.nickname} plays a {action[1]}, making the total {self.current_total}.')
            self.hands[self.active_user.id].remove(int(action[1]))
            if self.current_total == 21:
                self.result = {'winner': self.active_user.id}
                log_callback(f'{self.active_user.nickname} wins by reaching 21.')
            elif self.current_total > 21:
                self.result = {'winner': (self.turn_order[1 - self.active_player_index]).id}
                winner_nick = [p.nickname for p in self.config.players if p.id == self.result['winner']][0]
                log_callback(f'{self.active_user.nickname} went over 21. {winner_nick} wins.')
            else:
                self.hands[self.active_user.id].append(self.deck.pop())
            self.advance_turn()
        elif move_type == 'discard_double':
            log_callback(f'{self.active_user.nickname} discards a pair of {action[1]}s.')
            self.hands[self.active_user.id].remove(int(action[1]))
            self.hands[self.active_user.id].remove(int(action[1]))
            self.viewing = self.deck[:5]
            self.deck = self.deck[5:]
        elif move_type == 'pick':
            log_callback(f'{self.active_user.nickname} chooses a card from the top five of the deck.')
            self.hands[self.active_user.id].append(int(action[1]))
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
        result['hand_counts'] = {p.id: len(self.hands[p.id]) for p in self.config.players}
        return result
    def get_player_view(self, user):
        result = super(ExampleCardGameModel, self).get_player_view(user)
        result['my_hand'] = self.hands[user.id].copy()
        if self.viewing and user == self.active_user:
            result['viewing'] = self.viewing.copy()
        return result
