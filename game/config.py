import jsonobject as jo

#pylint can't find the classes defined in jsonobject for some reason
#pylint: disable=no-member

class IllegalConfig(Exception):
    pass

class BasePlayerOpts(jo.JsonObject):
    ready = jo.BooleanProperty(default=False)

class BaseConfig(jo.JsonObject):
    game_type = jo.StringProperty(required=True, choices=[])
    gameid = jo.StringProperty(required=True)
    players = jo.ListProperty(jo.StringProperty())
    playernicks = jo.DictProperty(jo.StringProperty())
    player_opts = jo.DictProperty(jo.ObjectProperty(BasePlayerOpts))
    def __init__(self, **kwargs):
        super(BaseConfig, self).__init__(**kwargs)
        self.validate()
    def validate(self):
        pass

class SquareSubtractionConfig(BaseConfig):
    starting_number = jo.IntegerProperty(required=True)
    def validate(self):
        super(SquareSubtractionConfig, self).validate()
        if self.starting_number <= 0:
            raise IllegalConfig('Starting number must be positive.')

class ExampleCardGamePlayerOpts(BasePlayerOpts):
    special_card = jo.IntegerProperty(default=0, choices=[0,6])

class ExampleCardGameConfig(BaseConfig):
    use_special_cards = jo.BooleanProperty(default=False)
    player_opts = jo.DictProperty(jo.ObjectProperty(ExampleCardGamePlayerOpts))
