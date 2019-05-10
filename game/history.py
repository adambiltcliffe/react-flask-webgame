import mongoengine as me

#pylint can't find the classes defined in jsonobject for some reason
#pylint: disable=no-member

class HistoryStep(me.EmbeddedDocument):
    log_message = me.StringField()
    public_view = me.DictField()
    public_view_delta = me.DictField()
    player_views = me.MapField(me.DictField())
    player_view_deltas = me.MapField(me.DictField())
