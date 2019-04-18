import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client'
import GameClient from './GameClient';
import LobbyClient from './LobbyClient';
import NavBar from './NavBar'
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

const initialState = {connected: false,
                      lobby: {
                        opened: false,
                        loaded: false,
                        games: []
                      },
                      currentGame: {
                        opened: false,
                        loaded: false,
                        id: null,
                        state: null
                      }}

function Application (props) {
  const socket = useRef(null)

  const [auth, setAuth] = useState({token: null})

  const [state, setState] = useState(initialState)

  useEffect(() => {
    socket.current = io({transports: ["websocket"], query: {token: auth.token}})
    socket.current.on('connect', () => {
      console.log('master socket connected!!')
      setState((s) => ({...s, connected: true}))
      socket.current.emit('open_lobby')
      setState((s) => ({...s, lobby: {...s.lobby, opened: true}}))
    })
    socket.current.on('disconnect', () => {
      console.log('master socket disconnected ...')
      setState((s) => ({...s, connected: false}))
    })
    socket.current.on('games_list', ({ gamelist }) => {
      setState((s) => ({...s, lobby: {...s.lobby, loaded: true, games: gamelist}}))
    })
    socket.current.on('game_status', ({ gameid, status }) => {
      setState((s) => ({...s, lobby: ({...s.lobby, games: ({...s.lobby.games, [gameid]: status})})}))
    })
    return function cleanup() {
      console.log("master socket cleaning up...")
      socket.current.close()
    }
  }, [auth])

  return  <BrowserRouter>
            <>
              <NavBar auth={auth} setAuth={setAuth} isConnected={state.connected} />
              <Switch>
                <Route exact path="/play/lobby">
                  <LobbyClient auth={auth} lobby={state.lobby}/>
                </Route>
                <Route path="/play/game/:gameid" render = {({ match }) => <GameClient gameid={match.params.gameid} auth={auth} />} />
                <Route><Redirect to="/404" /></Route>
              </Switch>
            </>
          </BrowserRouter>
};

export default Application;
