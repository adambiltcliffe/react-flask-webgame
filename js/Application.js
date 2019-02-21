import React from 'react';
import ioClient from 'socket.io-client';
import ButtonRow from './ButtonRow'

class Application extends React.Component {
  constructor(props) {
    super(props)
    this.state = {board: {}}
    this.sendTestMessage = this.sendTestMessage.bind(this)
  }
  render() {
    return (<div>
              <button id="testButton" onClick={this.sendTestMessage}>Test</button>
              <p>Current board state: {JSON.stringify(this.state.board)}.</p>
              <ButtonRow moves={this.state.board.moves} />
            </div>);
  }
  componentDidMount() {
    this.socket = ioClient.connect();
    this.socket.on('connect', function() {
      console.log('Websocket connected!');
    });
    this.socket.on('update', (function(msg) {
      this.setState({'board': msg})
    }).bind(this));
  }
  componentWillUnmount() {
    this.socket.disconnect()
  }
  sendTestMessage() {
    this.socket.emit('test', {data: 'brilliant'});
  }
};

export default Application;
