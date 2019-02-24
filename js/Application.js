import React from 'react';
import ioClient from 'socket.io-client';
import ButtonRow from './ButtonRow'

class Application extends React.Component {
  constructor(props) {
    super(props)
    this.state = {board: {}}
    this.sendMoveMessage = this.sendMoveMessage.bind(this)
  }
  render() {
    var buttonRow = null;
    if (this.state.board.moves)
    {
      buttonRow = <ButtonRow moves={this.state.board.moves} send={this.sendMoveMessage} />
    }
    return (<div>
              <button id="testButton" onClick={this.sendMoveMessage.bind(this, 'test')}>Test</button>
              <p>Current board state: {JSON.stringify(this.state.board)}.</p>
              {buttonRow}
            </div>);
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
