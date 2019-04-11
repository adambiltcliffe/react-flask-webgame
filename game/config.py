import jsonobject as jo

class GameConfig(jo.JsonObject):
    gameid = jo.IntegerProperty(required=True)
    players = jo.ListProperty(jo.StringProperty())
    playernicks = jo.DictProperty(jo.StringProperty())
