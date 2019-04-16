import React, { useState } from 'react';
import GameClient from './GameClient';
import LobbyClient from './LobbyClient';
import NavBar from './NavBar'
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

function Application (props) {
  const [auth, setAuth] = useState({token: null})
  return  <BrowserRouter>
            <>
              <NavBar auth={auth} setAuth={setAuth} />
              <Switch>
                <Route exact path="/play/lobby"><LobbyClient auth={auth}/></Route>
                <Route path="/play/game/:gameid" render = {({ match }) => <GameClient gameid={match.params.gameid} auth={auth} />} />
                <Route><Redirect to="/404" /></Route>
              </Switch>
            </>
          </BrowserRouter>
};

export default Application;
