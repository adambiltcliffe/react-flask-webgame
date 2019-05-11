import json_delta
import random
from game.config import BaseConfig, ExampleCardGameConfig, IllegalConfig, SquareSubtractionConfig
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

class GameNotJoinedError(Exception):
    pass

class IllegalAction(Exception):
    pass

class BaseGame:
    min_players = 2
    max_players = 2
    config_class = BaseConfig
    model_class = BaseModel
    type_string = None
    def __init_subclass__(cls):
        BaseConfig.game_type.choices.append(cls.type_string)
    def __init__(self, gameid, config_args):
        self.temp_config = self.config_class(gameid=gameid, game_type=self.type_string, **config_args)
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
        result = {'gameid': self.config.gameid,
                  'game_type': self.config.game_type,
                  'players': [p.id for p in self.config.players],
                  'playernicks': self.config.playernicks.copy(),
                  'status': self.status}
        return result
    @property
    def full(self):
        return len(self.config.players) == self.max_players
    def add_player(self, user):
        if self.full:
            raise GameFullError()
        if self.model is not None:
            raise GameAlreadyStartedError()
        self.config.players.append(user)
        self.config.playernicks[user.id] = user.nickname
        self.config.player_opts[user.id] = self.config.player_opts_class()
    def has_player(self, user):
        return user in self.config.players
    def remove_player(self, user):
        if not self.has_player(user):
            raise GameNotJoinedError()
        if self.model is not None:
            raise GameAlreadyStartedError()
        self.config.players.remove(user)
        del self.config.playernicks[user.id]
        del self.config.player_opts[user.id]
    def get_player_opts(self, user):
        return self.config.player_opts[user.id]
    def can_start(self):
        print("checking if game can start")
        print(self.config)
        if len(self.config.players) < self.min_players:
            return False
        for user in self.config.players:
            if self.config.player_opts[user.id].ready == False:
                return False
        return True
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
    def get_player_view(self, user):
        return self.get_public_view()
    def update_history(self):
        if len(self.history) == 0:
            last_step_bson = HistoryStep(public_view={}, player_views={p.id: {} for p in self.config.players}).to_mongo()
        else:
            last_step_bson = self.history[-1].to_mongo()
        step = HistoryStep(log_message=' '.join(self.current_step_log))
        pv = self.get_public_view()
        step.public_view = pv
        step.public_view_delta = json_delta.diff(last_step_bson['public_view'], pv, verbose=False)
        for p in self.config.players:
            spv = self.get_player_view(p)
            step.player_views[p.id] = spv
            step.player_view_deltas[p.id] = json_delta.diff(last_step_bson['player_views'][p.id], spv, verbose=False)
        self.history.append(step)
        self.current_step_log = []
    def get_observer_channel(self):
        return f'{self.config.gameid}-observers'
    def get_channel_for_user(self, user):
        if user in self.config.players:
            return f'{self.config.gameid}-player-{str(user.id)}'
        else:
            return self.get_observer_channel()
    def get_available_opts(self, user):
        return self.config.player_opts[user.id].to_mongo() if user in self.config.players else None
    def get_pregame_update(self, user):
        ready = {str(user.id): self.config.player_opts[user.id].ready for user in self.config.players}
        opts = self.get_available_opts(user)
        return {'gameid': self.config.gameid,
                'info': self.get_lobby_info(),
                'ready': ready,
                'opts': opts}
    def get_pregame_updates(self):
        for user in self.config.players:
            yield (self.get_channel_for_user(user), 'update_pregame', self.get_pregame_update(user))
    def get_full_update(self, user):
        if user not in self.config.players:
            return {'gameid': self.config.gameid,
                    'history': [{'text': h.log_message, 'delta': h.public_view_delta} for h in self.history],
                    'prompts': {}}
        return {'gameid': self.config.gameid,
                'history': [{'text': h.log_message, 'delta': h.player_view_deltas[user.id]} for h in self.history],
                'prompts': self.get_current_prompts(user)}
    def get_full_updates(self):
        for user in self.config.players:
            yield(self.get_channel_for_user(user), 'update_full', self.get_full_update(user))
    def get_step_update(self, user):
        if user not in self.config.players:
            delta = self.history[-1].public_view_delta
            prompts = {}
        else:
            delta = self.history[-1].player_view_deltas[user.id]
            prompts = self.get_current_prompts(user)
        idx = len(self.history) - 1
        return {'gameid': self.config.gameid,
                'index': idx,
                'step': {'text': self.history[-1].log_message, 'delta': delta},
                'prompts': prompts}
    def get_current_prompts(self, user):
        return {'buttons': [[act, act] for act in self.model.get_actions(user)]}
    def handle_action(self, user, action):
        if not self.model.is_legal_action(user, action):
            raise IllegalAction()
        self.model.apply_action(user, action, self.log)
        self.update_history()
        yield (self.get_observer_channel(), 'update_step', self.get_step_update(None))
        for user in self.config.players:
            yield (self.get_channel_for_user(user), 'update_step', self.get_step_update(user))

class SquareSubtractionGame(BaseGame):
    min_players = 2
    max_players = 2
    type_string = 'subtract_square'
    config_class = SquareSubtractionConfig
    model_class = SquareSubtractionModel
    def get_lobby_info(self):
        result = super(SquareSubtractionGame, self).get_lobby_info()
        if self.model is not None:
            result['turn'] = self.model.active_user.id
        return result

class ExampleCardGame(BaseGame):
    min_players = 2
    max_players = 2
    type_string = 'example_card'
    config_class = ExampleCardGameConfig
    model_class = ExampleCardGameModel
    def get_lobby_info(self):
        result = super(ExampleCardGame, self).get_lobby_info()
        if self.model is not None:
            result['turn'] = self.model.active_user.id
        return result
    def get_available_opts(self, user):
        if user not in self.config.players:
            return None
        opts = self.config.player_opts[user.id].to_mongo()
        if not self.config.use_special_cards:
            del opts['special_card']
        return opts
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
    def get_current_prompts(self, user):
        buttons_prompts = [[self.get_text_for_action(act), act] for act in self.model.get_actions(user)]
        hand_card_prompts = {card: [] for card in self.model.hands[user.id]}
        viewed_card_prompts = {card: [] for card in self.model.viewing or []}
        text = 'Waiting ...'
        verbs = set()
        for act in self.model.get_actions(user):
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
