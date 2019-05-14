import mongoengine as me

class User(me.Document):
    test_key = me.SequenceField(primary_key=True, value_decorator=str)
    is_anonymous = me.BooleanField(db_field='anon', default=False)
    nickname = me.StringField(required=True)
    test_login = me.StringField(required=False)

def get_guest():
    try:
        return User.objects(is_anonymous=True).get()
    except User.DoesNotExist:
        u = User(is_anonymous=True, nickname='Guest')
        u.save()
        return u
