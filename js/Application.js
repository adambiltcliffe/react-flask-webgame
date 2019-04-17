import React, { useEffect, useState } from 'react';
import io from 'socket.io-client'
import GameClient from './GameClient';
import LobbyClient from './LobbyClient';
import NavBar from './NavBar'
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

function Application (props) {
  const [auth, setAuth] = useState({token: null})

  const [isConnected, setConnected] = useState(false)
  const [lobbyLoaded, setLobbyLoaded] = useState(false)
  const [socket, setSocket] = useState(null)
  const [games, setGames] = useState({})

  useEffect(() => {
    const sock = io({transports: ["websocket"], query: {token: auth.token}})
    sock.on('connect', () => {
      console.log('master socket connected!!')
      setConnected(true)
      sock.emit('open_lobby')
    })
    sock.on('disconnect', () => {
      console.log('master socket disconnected ...')
      setConnected(false)
    })
    sock.on('games_list', ({ gamelist }) => {
      setGames(gamelist)
      setLobbyLoaded(true)
    })
    sock.on('game_status', ({ gameid, status }) => {
      setGames((games) => {return {...games, [gameid]: status}})
    })
    setSocket(sock)
    return function cleanup() {
      console.log("master socket cleaning up...")
      sock.disconnect()
    }
  }, [auth])

  return  <BrowserRouter>
            <>
              <NavBar auth={auth} setAuth={setAuth} isConnected={isConnected} />
              <Switch>
                <Route exact path="/play/lobby">
                  {lobbyLoaded ? <LobbyClient auth={auth} games={games}/> : <div>Loading lobby ...</div>}
                </Route>
                <Route path="/play/game/:gameid" render = {({ match }) => <GameClient gameid={match.params.gameid} auth={auth} />} />
                <Route><Redirect to="/404" /></Route>
              </Switch>
            </>
          </BrowserRouter>
};

export default Application;
