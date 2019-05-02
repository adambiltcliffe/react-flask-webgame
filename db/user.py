class User(object):
    is_anonymous = False
    def __init__(self, userid, nickname):
        self.id = userid
        self.nickname = nickname

class AnonymousUser(User):
    is_anonymous = True
    def __init__(self):
        super(AnonymousUser, self).__init__(None, 'Guest')
