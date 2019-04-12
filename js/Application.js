import React, { useState } from 'react';
import GameClient from './GameClient';
import LobbyClient from './LobbyClient';
import NavBar from './NavBar'
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

function Application (props) {
  const [authNickname, setAuthNickname] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  return  <BrowserRouter>
            <>
              <NavBar authNickname={authNickname} setAuthNickname={setAuthNickname} setAuthToken={setAuthToken} />
              <Switch>
                <Route exact path="/play/lobby"><LobbyClient authToken={authToken}/></Route>
                <Route path="/play/game/:gameid" render = {({ match }) => <GameClient gameid={match.params.gameid} authToken={authToken} />} />
                <Route><Redirect to="/404" /></Route>
              </Switch>
            </>
          </BrowserRouter>
};

export default Application;
