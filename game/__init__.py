import json_delta
import random
from game.config import GameConfig
from game.history import HistoryStep
from game.model import BaseModel, SquareSubtractionModel, ExampleCardGameModel

class GameFullError(Exception):
    pass

class GameNotFullError(Exception):
    pass

class GameAlreadyStartedError(Exception):
    pass

class GameNotStartedError(Exception):
    pass

class IllegalAction(Exception):
    pass

class BaseGame:
    min_players = 2
    max_players = 2
    model_class = BaseModel
    type_string = None
    def __init_subclass__(cls):
        GameConfig.properties()['game_type'].choice_keys.append(cls.type_string)
    def __init__(self, gameid):
        self.temp_config = GameConfig(gameid=gameid, game_type=self.type_string)
        self.model = None
        self.history = []
    @property
    def config(self):
        if self.model is None:
            return self.temp_config
        return self.model.config
    @property
    def status(self):
        if self.model is None:
            return 'WAIT' if len(self.config.players) < self.min_players else 'READY'
        return self.model.status
    def get_lobby_info(self):
        return {'gameid': self.config.gameid,
                'game_type': self.config.game_type,
                'players': self.config.players.copy(),
                'playernicks': self.config.playernicks.copy(),
                'status': self.status}
    @property
    def full(self):
        return len(self.config.players) == self.max_players
    def add_player(self, userid, nick):
        if self.full:
            raise GameFullError()
        if self.model is not None:
            raise GameAlreadyStartedError()
        self.config.players.append(userid)
        self.config.playernicks[userid] = nick
    def start(self):
        if len(self.config.players) < self.min_players:
            raise GameNotFullError()
        self.model = self.model_class(self.config)
        self.temp_config = None
        self.current_step_log = [self.model.get_start_message()]
        self.update_history()
    def log(self, message):
        self.current_step_log.append(message)
    def get_public_view(self):
        return {**self.get_lobby_info(), **self.model.get_public_view()}
    def get_player_view(self, userid):
        return {**self.get_lobby_info(), **self.model.get_player_view(userid)}
    def update_history(self):
        if len(self.history) == 0:
            last_step_json = HistoryStep(public_view={}, player_views={uid: {} for uid in self.config.players}).to_json()
        else:
            last_step_json = self.history[-1].to_json()
        step = HistoryStep(log_message=' '.join(self.current_step_log))
        pv = self.get_public_view()
        step.public_view = pv
        step.public_view_delta = json_delta.diff(last_step_json['public_view'], pv, verbose=False)
        for uid in self.config.players:
            spv = self.get_player_view(uid)
            step.player_views[uid] = spv
            step.player_view_deltas[uid] = json_delta.diff(last_step_json['player_views'][uid], spv, verbose=False)
        self.history.append(step)
        self.current_step_log = []
    def get_observer_channel(self):
        return f'{self.config.gameid}-observers'
    def get_channel_for_user(self, userid):
        print(userid, self.config.players)
        if userid in self.config.players:
            return f'{self.config.gameid}-player-{userid}'
        else:
            return self.get_observer_channel()
    def get_all_channels(self):
        for userid in self.config.players:
            yield self.get_channel_for_user(userid)
        yield self.get_observer_channel()
    def get_full_update(self, uid):
        if uid not in self.config.players:
            return {'gameid': self.config.gameid,
                    'history': [{'text': h.log_message, 'delta': h.public_view_delta} for h in self.history],
                    'prompts': {}}
        return {'gameid': self.config.gameid,
                'history': [{'text': h.log_message, 'delta': h.player_view_deltas[uid]} for h in self.history],
                'prompts': self.get_current_prompts(uid)}
    def get_step_update(self, uid):
        if uid not in self.config.players:
            delta = self.history[-1].public_view_delta
            prompts = {}
        else:
            delta = self.history[-1].player_view_deltas[uid]
            prompts = self.get_current_prompts(uid)
        idx = len(self.history) - 1
        return {'gameid': self.config.gameid,
                'index': idx,
                'step': {'text': self.history[-1].log_message, 'delta': delta},
                'prompts': prompts}
    def get_current_prompts(self, userid):
        return {'buttons': [[act, act] for act in self.model.get_actions(userid)]}
    def handle_action(self, userid, action):
        if not self.model.is_legal_action(userid, action):
            raise IllegalAction()
        self.model.apply_action(userid, action, self.log)
        self.update_history()
        yield (self.get_observer_channel(), 'update_step', self.get_step_update(None))
        for uid in self.config.players:
            yield (self.get_channel_for_user(uid), 'update_step', self.get_step_update(uid))

class SquareSubtractionGame(BaseGame):
    min_players = 2
    max_players = 2
    type_string = 'subtract_square'
    model_class = SquareSubtractionModel
    def get_lobby_info(self):
        result = super(SquareSubtractionGame, self).get_lobby_info()
        if self.model is not None:
            result['turn'] = self.model.active_userid
        return result

class ExampleCardGame(BaseGame):
    min_players = 2
    max_players = 2
    type_string = 'example_card'
    model_class = ExampleCardGameModel
    def get_lobby_info(self):
        result = super(ExampleCardGame, self).get_lobby_info()
        if self.model is not None:
            result['turn'] = self.model.active_userid
        return result
    @staticmethod
    def get_text_for_action(action):
        if action[0] == 'play':
            return f'Play a {action[1]}'
        elif action[0] == 'discard_double':
            return f'Discard a pair of {action[1]}s'
        elif action[0] == 'pick':
            return f'Take a {action[1]}'
        elif action[0] == 'restart':
            return 'Restart the game'
        else:
            return '???'
    def get_current_prompts(self, userid):
        buttons_prompts = [[self.get_text_for_action(act), act] for act in self.model.get_actions(userid)]
        hand_card_prompts = {card: [] for card in self.model.hands[userid]}
        viewed_card_prompts = {card: [] for card in self.model.viewing or []}
        text = 'Waiting ...'
        verbs = set()
        for act in self.model.get_actions(userid):
            verbs.add(act[0])
            if act[0] == 'play' or act[0] == 'discard_double':
                hand_card_prompts[act[1]].append([self.get_text_for_action(act), act])
            if act[0] == 'pick':
                viewed_card_prompts[act[1]].append([self.get_text_for_action(act), act])
        if 'discard_double' in verbs and 'play' in verbs:
            text = 'Play a card from your hand or discard a pair.'
        elif 'play' in verbs:
            text = 'Play a card from your hand.'
        elif 'pick' in verbs:
            text = 'Choose one of the revealed cards.'
        elif 'restart' in verbs:
            text = 'The round has ended.'
        elif len(verbs) > 0:
            text = 'Choose an action.'
        return {'text': text, 'buttons': buttons_prompts, 'hand_card': hand_card_prompts, 'viewed_card': viewed_card_prompts}
