import React from 'react';
import ioClient from 'socket.io-client';
import GameClient from './GameClient'

class Application extends React.Component {
  constructor(props) {
    super(props)
    this.state = {board: {}}
    this.sendMoveMessage = this.sendMoveMessage.bind(this)
  }
  render() {
    return <GameClient board={this.state.board} send={this.sendMoveMessage}/>;
  }
  componentDidMount() {
    this.socket = ioClient.connect();
    this.socket.on('connect', function() {
      console.log('Websocket connected!');
    })
    this.socket.on('identify', function(name) {
      console.log('Server knows us as ' + name)
    })
    this.socket.on('update', (function(msg) {
      this.setState({'board': msg})
    }).bind(this));
  }
  componentWillUnmount() {
    this.socket.disconnect()
  }
  sendMoveMessage(moveName) {
    this.socket.emit('make_move', {move: moveName});
  }
};

export default Application;
