import React from 'react';
import ioClient from 'socket.io-client';
import GameClient from './GameClient';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

class Application extends React.Component {
  constructor(props) {
    super(props)
    this.state = {currentGame: {}, clientState: {isConnected: false, isLoaded: false, user: null, error: null}}
    this.send = this.send.bind(this)
    console.log("Application constructed")
  }
  render() {
    return <BrowserRouter>
              <Switch>
                <Route exact path="/play/lobby"><p>This is ... the lobby?</p></Route>
                <Route path="/play/game/:gameid" render = {({ match }) => <GameClient game={this.state.currentGame}
                                                                          clientState = {this.state.clientState}
                                                                          send={this.send}
                                                                          gameid={match.params.gameid} />} />
                <Route><Redirect to="/404" /></Route>
              </Switch>
            </BrowserRouter>;
  }
  componentDidMount() {
    this.socket = ioClient.connect();
    this.socket.on('connect', (function() {
      console.log('Websocket connected!');
      console.log(JSON.stringify(this.state))
      this.setState((s) => {return {clientState: {...s.clientState, isConnected: true}}})
      console.log(JSON.stringify(this.state))
    }).bind(this))
    this.socket.on('identify', (function(name) {
      console.log('Server knows us as ' + name)
      console.log(JSON.stringify(this.state))
      this.setState((s) => {return {clientState: {...s.clientState, user: name}}})
    }).bind(this))
    this.socket.on('update', (function(data) {
      console.log('Received update')
      this.setState((s) => {return {currentGame: data, clientState: {...s.clientState, isLoaded: true}}})
    }).bind(this));
    this.socket.on('client_error', (function(msg) {
      console.log('Received client error: ' + msg)
      this.setState((s) => {return {clientState: {...s.clientState, error: msg}}})
    }).bind(this));
  }
  componentWillUnmount() {
    this.socket.disconnect()
  }
  send(message, data) {
    console.log(message)
    this.socket.emit(message, data);
    console.log("sent")
  }
};

export default Application;
