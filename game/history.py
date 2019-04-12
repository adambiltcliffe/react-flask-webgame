import jsonobject as jo

#pylint can't find the classes defined in jsonobject for some reason
#pylint: disable=no-member

class HistoryStep(jo.JsonObject):
    log_message = jo.StringProperty()
    public_view = jo.DefaultProperty()
    public_view_delta = jo.DefaultProperty()
    player_views = jo.DictProperty(jo.DefaultProperty())
    player_view_deltas = jo.DictProperty(jo.DefaultProperty())
