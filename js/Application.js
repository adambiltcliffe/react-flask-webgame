import React, { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client'
import GameClient from './GameClient';
import LobbyClient from './LobbyClient';
import NavBar from './NavBar'
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';

function nonDestructivePatch(oldStruc, patch) {
  /* This is inefficient and should eventually be fixed by rewriting JSON_delta */
  const newStruc = JSON.parse(JSON.stringify(oldStruc))
  return JSON_delta.patch(newStruc, patch)
}

const getInitialState = () => ({
  connected: false,
  error: null,
  lobby: {
    opened: false,
    loaded: false,
    games: []
  },
  games: {}
})
const getInitialGameState = () => ({
  opened: false,
  loaded: false,
  history: [],
  states: [],
  prompts: [],
  shownStep: 0
})

function Application (props) {
  console.log(Object.keys(props))

  const socket = useRef(null)
  const [auth, setAuth] = useState(null)
  const [state, setState] = useState(getInitialState)
  useEffect(() => {
    if (!auth) {
      console.log('Doing nothing for now, auth info not loaded')
      console.log(auth)
    }
    else {
      console.log("application effect creating socket")
      socket.current = io({transports: ["websocket"], query: {token: auth.token}})
      socket.current.on('connect', () => {
        console.log('socket connected!! scheduling setState call to delete saved state')
        // erase all other state when we connect as we are probably not in sync with the server
        setState((s) => {
          console.log('deleting all the state')
          return ({...getInitialState(), connected: true})
        })
      })
      socket.current.on('disconnect', () => {
        console.log('socket disconnected ...')
        setState((s) => {
          console.log('marking socket as disconnected in state')
          return ({...s, connected: false})
        })
      })
      socket.current.on('client_error', (error) => {
        setState((s) => ({...s, error}))
      })
      socket.current.on('games_list', ({ gamelist }) => {
        setState((s) => ({...s, lobby: {...s.lobby, loaded: true, games: gamelist}}))
      })
      socket.current.on('game_status', ({ gameid, status }) => {
        setState((s) => ({...s, lobby: ({...s.lobby, games: ({...s.lobby.games, [gameid]: status})})}))
      })
      socket.current.on('update_full', ({ gameid, history, prompts }) => {
        console.log('received update')
        console.log('scheduling setstate call to process the update')
        setState((s) => {
          if (s.games[gameid] === undefined) {
            console.log('Ignoring an update for an unknown game')
            return s
          }
          else {
            console.log('processing update')
            let computedState = {}
            let computedStateArray = []
            history.map((step) => {
              computedState = nonDestructivePatch(computedState, step.delta)
              computedStateArray.push(computedState)
            })
            return ({...s, games: {...s.games, [gameid]: {
              opened: true,
              loaded: true,
              history,
              prompts,
              states: computedStateArray,
              shownStep: computedStateArray.length - 1
            }}})
          }
        })
      })
      socket.current.on('update_step', ({ gameid, index, step, prompts }) => {
        setState((s) => {
          if (s.games[gameid] === undefined || index != s.games[gameid].history.length) {
            return s
          }
          else {
            let g = s.games[gameid]
            let history = g.history.concat([step])
            let states = g.states.concat(nonDestructivePatch(g.states[index - 1], step.delta))
            let shownStep = (g.shownStep == g.history.length - 1) ? g.shownStep + 1 : g.shownStep
            return ({...s, games: {...s.games, [gameid]: { opened: true, loaded: true, history, prompts, states, shownStep }}})
          }
        })
      })
      return (() => {
        console.log("master socket cleaning up...")
        socket.current.close()
      })
    }
  }, [auth])

  const openLobby = useCallback(() => {
    console.log("Opening lobby")
    socket.current.emit('open_lobby')
    setState((s) => ({...s, lobby: {...s.lobby, opened: true}}))
  }, [])

  const closeLobby = useCallback(() => {
    console.log("Closing lobby")
    socket.current.emit('close_lobby')
    setState((s) => ({...s, lobby: {...s.lobby, closed: true}}))
  }, [])

  const openGame = useCallback((gameid) => {
    console.log("Opening game " + gameid)
    socket.current.emit('open_game', {gameid})
    console.log('scheduling setstate call to mark game as opened')
    setState((s) => {
      console.log('marking game as opened')
      if (s.games[gameid] !== undefined) {
        return s // if it was already in state.games, don't erase what we have
      }
      return ({...s, games: {...s.games, [gameid]: {...getInitialGameState(), opened: true}}})
    })
    setState((s) => { console.log(s); return s })
  }, [])

  const closeGame = useCallback((gameid) => {
    console.log("Closing game " + gameid)
    socket.current.emit('close_game', {gameid})
    setState((s) => ({...s, games: {...s.games, [gameid]: undefined}}))
  }, [])

  const setShownStep = useCallback((gameid, shownStep) => {
    setState((s) => ({...s, games: {...s.games, [gameid]: {...s.games[gameid], shownStep}}}))
  }, [])

  const resetShownStep = useCallback((gameid) => {
    setState((s) => ({...s, games: {...s.games, [gameid]: {...s.games[gameid], shownStep: s.games[gameid].history.length - 1}}}))
  }, [])

  const dispatchAction = useCallback((gameid, action) => {
    socket.current.emit('game_action', {gameid, action})
  }, [])

  if (state.error) {
    return <div>Client error: {state.error}</div>
  }

  return  <>
            <NavBar auth={auth} setAuth={setAuth} isConnected={state.connected} />
            <Switch>
              <Route exact path="/play/lobby">
                <LobbyClient auth={auth} lobby={state.lobby} openLobby={openLobby} closeLobby={closeLobby} isConnected={state.connected} />
              </Route>
              <Route path="/play/game/:gameid"render = {({ match }) => <GameClient
                gameid={match.params.gameid}
                auth={auth}
                game={state.games[match.params.gameid]}
                openGame={openGame}
                closeGame={closeGame}
                setShownStep={setShownStep}
                resetShownStep={resetShownStep}
                dispatchAction={dispatchAction}
                isConnected={state.connected} />} />
              <Route><Redirect to="/404" /></Route>
            </Switch>
          </>
};

export default withRouter(Application);
