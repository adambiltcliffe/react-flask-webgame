import jsonobject as jo

class GameConfig(jo.JsonObject):
    game_type = jo.StringProperty(required=True, choices=[])
    gameid = jo.IntegerProperty(required=True)
    players = jo.ListProperty(jo.StringProperty())
    playernicks = jo.DictProperty(jo.StringProperty())
