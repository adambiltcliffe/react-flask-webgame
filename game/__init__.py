class Game:
    def __init__(self, player1, player2):
        self.start(player1, player2)
    def start(self, player1, player2):
        self.state = {'players': [player1, player2], 'active': 1, 'number': 30, 'winner': None}
        self.find_moves()
    @property
    def active_userid(self):
        return self.state['players'][self.state['active'] - 1]
    def find_moves(self):
        if self.state['winner'] is not None:
            self.moves_for_player = {p: ['restart'] for p in self.state['players']}
        else:
            self.moves_for_player = {p: [] for p in self.state['players']}
            n = 1
            while n ** 2 <= self.state['number']:
                self.moves_for_player[self.active_userid].append(str(n**2))
                n += 1
    def make_move(self, userid, move):
        if move not in self.moves_for_player[userid]:
            return False
        if move == 'restart':
            self.start(*self.state['players'][::-1])
        else:
            self.state['number'] -= int(move)
            if self.state['number'] == 0:
                self.state['winner'] = userid
            self.state['active'] = 3 - self.state['active']
        self.find_moves()
        return True
    def get_lobby_view(self):
        p = self.state['players']
        view = {'players': p, 'turn': p[self.state['active']-1], 'status': 'active' if self.state['winner'] is None else 'finished'}
        return view
    def get_user_view(self, userid):
        view = {k: v for k, v in self.state.items()}
        view['who_am_i'] = userid
        if userid in self.state['players']:
            view['moves'] = self.moves_for_player[userid][:]
        else:
            view['moves'] = []
        return view
