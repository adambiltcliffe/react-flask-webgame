import jsonobject as jo

class GameMetaInfo(jo.JsonObject):
    gameid = jo.IntegerProperty(required=True)
    players = jo.ListProperty(jo.StringProperty())
    playernicks = jo.DictProperty(jo.StringProperty())
    status = jo.StringProperty(required=True, default='waiting', choices=['waiting', 'started', 'finished'])
    winner = jo.StringProperty()
