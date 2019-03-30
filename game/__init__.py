class Game:
    def __init__(self, gameid, player1, player1nick, player2, player2nick):
        self.gameid = gameid
        self.start(player1, player1nick, player2, player2nick)
    def start(self, player1, player1nick, player2, player2nick):
        self.playerids = [player1, player2]
        self.playernicks = [player1nick, player2nick]
        self.active_player_index = 0
        self.number = 30
        self.winner = None
        self.find_moves()
    @property
    def active_userid(self):
        return self.playerids[self.active_player_index]
    @property
    def active_usernick(self):
        return self.playernicks[self.active_player_index]
    def find_moves(self):
        if self.winner is not None:
            self.moves_for_player = {p: ['restart'] for p in self.playerids}
        else:
            self.moves_for_player = {p: [] for p in self.playerids}
            n = 1
            while n ** 2 <= self.number:
                self.moves_for_player[self.active_userid].append(str(n**2))
                n += 1
    def make_move(self, userid, move):
        if move not in self.moves_for_player[userid]:
            return False
        if move == 'restart':
            self.start(self.playerids[1], self.playernicks[1], self.playerids[0], self.playernicks[0])
        else:
            self.number -= int(move)
            if self.number == 0:
                self.winner = userid
            self.active_player_index = 1 - self.active_player_index
        self.find_moves()
        return True
    def get_channel_for_user(self, userid):
        if userid == self.playerids[0]:
            return f'{self.gameid}-player-1'
        elif userid == self.playerids[1]:
            return f'{self.gameid}-player-2'
        else:
            return f'{self.gameid}-observers'
    def get_lobby_view(self):
        p = self.playernicks
        view = {'players': p, 'turn': self.active_usernick, 'status': 'active' if self.winner is None else 'finished'}
        return view
    def get_user_view(self, userid):
        view = self.get_lobby_view()
        try:
            idx = self.playerids.index(userid)
        except ValueError:
            idx = None
        view['my_player_index'] = idx
        view['number'] = self.number
        view['winner'] = self.winner
        if userid in self.moves_for_player:
            view['my_moves'] = self.moves_for_player[userid][:]
        else:
            view['my_moves'] = []
        return view
    def get_channel_views(self):
        for uid in self.playerids + ['anonymous']:
            yield (self.get_channel_for_user(uid), self.get_user_view(uid))
