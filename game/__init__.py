class Game:
    def __init__(self):
        self.state = {'tally': {'pass': 0, 'capitulate': 0, 'ionize': 0, 'redraw': 0}, 'turn': 0, 'moves': ['twirl']}
    def make_move(self, move):
        if move in self.state['tally']:
            self.state['tally'][move] += 1
        self.state['turn'] += 1
        moves = ['pass']
        if self.state['turn'] % 3 == 0: moves.append('capitulate')
        if self.state['turn'] % 4 == 0: moves.append('redraw')
        if self.state['turn'] % 5 == 0: moves.append('ionize')
        self.state['moves'] = moves
