import React from 'react';
import GameClient from './GameClient';
import LobbyClient from './LobbyClient';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

function Application (props) {
  return  <BrowserRouter>
            <Switch>
              <Route exact path="/play/lobby"><LobbyClient /></Route>
              <Route path="/play/game/:gameid" render = {({ match }) => <GameClient gameid={match.params.gameid} />} />
              <Route><Redirect to="/404" /></Route>
            </Switch>
          </BrowserRouter>
};

export default Application;
