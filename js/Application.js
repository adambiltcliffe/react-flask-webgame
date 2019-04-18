import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    console.log("gameclient effect")
    socket.current = io({transports: ["websocket"], query: {token: auth.token}})
    socket.current.on('connect', () => {
      console.log('master socket connected!!')
      setState((s) => ({...s, connected: true}))
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

  const openLobby = useCallback(() => {
    console.log("Opening lobby")
    socket.current.emit('open_lobby')
    setState((s) => ({...s, lobby: {...s.lobby, opened: true}}))
  })

  const closeLobby = useCallback(() => {
    console.log("Closing lobby")
    socket.current.emit('close_lobby')
    setState((s) => ({...s, lobby: {...s.lobby, closed: true}}))
  })

  return  <BrowserRouter>
            <>
              <NavBar auth={auth} setAuth={setAuth} isConnected={state.connected} />
              <Switch>
                <Route exact path="/play/lobby">
                  <LobbyClient auth={auth} lobby={state.lobby} openLobby={openLobby} closeLobby={closeLobby} isConnected={state.connected} />
                </Route>
                <Route path="/play/game/:gameid" render = {({ match }) => <GameClient gameid={match.params.gameid} auth={auth} />} />
                <Route><Redirect to="/404" /></Route>
              </Switch>
            </>
          </BrowserRouter>
};

export default Application;
