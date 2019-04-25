import jsonobject as jo

#pylint can't find the classes defined in jsonobject for some reason
#pylint: disable=no-member

class GameConfig(jo.JsonObject):
    game_type = jo.StringProperty(required=True, choices=[])
    gameid = jo.StringProperty(required=True)
    players = jo.ListProperty(jo.StringProperty())
    playernicks = jo.DictProperty(jo.StringProperty())
