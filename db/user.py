import mongoengine as me

class User(me.Document):
    is_anonymous = me.BooleanField(db_field='anon', default=False)
    nickname = me.StringField(required=True)
    test_login = me.StringField(required=False, primary_key=True)

def get_guest():
    return User.objects(is_anonymous=True).upsert_one(set__nickname='Guest')
