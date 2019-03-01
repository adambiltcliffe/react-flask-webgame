import React from 'react';
import GameClient from './GameClient';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

function Application (props) {
  return <BrowserRouter>
            <Switch>
              <Route exact path="/play/lobby"><p>This is ... the lobby?</p></Route>
              <Route path="/play/game/:gameid" render = {({ match }) => <GameClient gameid={match.params.gameid} />} />
              <Route><Redirect to="/404" /></Route>
            </Switch>
          </BrowserRouter>;
};

export default Application;
