import mongoengine as me

#pylint can't find the classes defined in jsonobject for some reason
#pylint: disable=no-member

class IllegalConfig(Exception):
    pass

class BasePlayerOpts(me.EmbeddedDocument):
    meta = {'allow_inheritance': True}
    ready = me.BooleanField(default=False)

class BaseConfig(me.EmbeddedDocument):
    meta = {'allow_inheritance': True}
    player_opts_class = BasePlayerOpts
    game_type = me.StringField(required=True, choices=[])
    gameid = me.StringField(required=True) # TODO get rid of this
    players = me.ListField(me.ReferenceField('User'))
    player_opts = me.MapField(me.EmbeddedDocumentField(BasePlayerOpts))

class SquareSubtractionConfig(BaseConfig):
    starting_number = me.IntField(required=True, min_value=1)

class ExampleCardGamePlayerOpts(BasePlayerOpts):
    special_card = me.IntField(default=0, choices=[0,6])

class ExampleCardGameConfig(BaseConfig):
    player_opts_class = ExampleCardGamePlayerOpts
    use_special_cards = me.BooleanField(default=False)
