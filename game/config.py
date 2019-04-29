import jsonobject as jo

#pylint can't find the classes defined in jsonobject for some reason
#pylint: disable=no-member

class IllegalConfig(Exception):
    pass

class BaseConfig(jo.JsonObject):
    game_type = jo.StringProperty(required=True, choices=[])
    gameid = jo.StringProperty(required=True)
    players = jo.ListProperty(jo.StringProperty())
    playernicks = jo.DictProperty(jo.StringProperty())
    def __init__(self, **kwargs):
        super(BaseConfig, self).__init__(**kwargs)
        self.validate()
    def validate(self):
        pass

class SquareSubtractionConfig(BaseConfig):
    starting_number = jo.IntegerProperty(required=True)
    def validate(self):
        if self.starting_number <= 0:
            raise IllegalConfig('Starting number must be positive.')
