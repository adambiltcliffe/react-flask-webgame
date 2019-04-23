import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import io from 'socket.io-client'
import { handlerContext } from './handler'
import GameClient from './GameClient';
import LobbyClient from './LobbyClient';
import NavBar from './NavBar'
import { Route, Switch, Redirect, matchPath, withRouter } from 'react-router-dom';

function nonDestructivePatch(oldStruc, patch) {
  /* This is inefficient and should eventually be fixed by rewriting JSON_delta */
  const newStruc = JSON.parse(JSON.stringify(oldStruc))
  return JSON_delta.patch(newStruc, patch)
}

const gameRoutePath = "/play/game/:gameid"

const getInitialState = () => ({
  connected: false,
  error: null,
  lobby: {
    opened: false,
    loaded: false,
    games: []
  },
  game: getInitialGameState()
})
const getInitialGameState = () => ({
  id: null,
  opened: false,
  loaded: false,
  history: [],
  states: [],
  prompts: [],
  shownStep: 0
})

const reducer = (s, action) => {
  console.log(JSON.stringify(action))
  switch (action.type) {
    case 'connect':
      // erase all other state when we connect as we are probably not in sync with the server
      return ({...getInitialState(), connected: true})
    case 'disconnect':
      return ({...s, connected: false})
    case 'client_error':
      return ({...s, error: action.error})
    case 'games_list':
      return ({...s, lobby: {...s.lobby, loaded: true, games: action.gamelist}})
    case 'game_status':
      return ({...s, lobby: ({...s.lobby, games: ({...s.lobby.games, [action.gameid]: action.status})})})
    case 'update_full':
      if (s.game.id != action.gameid) {
        console.log('Ignoring an update for an unknown game')
        return s
      }
      else {
        console.log('processing update')
        let computedState = {}
        let computedStateArray = []
        action.history.map((step) => {
          computedState = nonDestructivePatch(computedState, step.delta)
          computedStateArray.push(computedState)
        })
        return ({...s, game: {
          id: action.gameid,
          opened: true,
          loaded: true,
          history: action.history,
          prompts: action.prompts,
          states: computedStateArray,
          shownStep: computedStateArray.length - 1
        }})
      }
    case 'update_step':
      if (s.game.id != action.gameid || action.index != s.game.history.length) {
        return s
      }
      else {
        let history = s.game.history.concat([action.step])
        let states = s.game.states.concat(nonDestructivePatch(s.game.states[action.index - 1], action.step.delta))
        let shownStep = (s.game.shownStep == s.game.history.length - 1) ? s.game.shownStep + 1 : s.game.shownStep
        return ({...s, game: { id: action.gameid, opened: true, loaded: true, history, prompts: action.prompts, states, shownStep }})
      }
    case 'open_lobby':
      return ({...s, lobby: {...s.lobby, opened: true}})
    case 'close_lobby':
      return ({...s, lobby: {...s.lobby, closed: true}})
    case 'open_game':
      return ({...s, game: {...getInitialGameState(), id: action.gameid, opened: true}})
    case 'close_game':
      return ({...s, game: getInitialGameState()})
    case 'set_shown_step':
      return ({...s, game: {...s.game, shownStep: action.shownStep}})
    case 'reset_shown_step':
      return ({...s, game: {...s.game, shownStep: s.game.history.length - 1}})
    default:
      console.log('Unrecognised action: ' + JSON.stringify(action))
  }
}

function Application (props) {
  const matchedPath = matchPath(location.pathname, gameRoutePath)
  const currentGameid = (matchedPath && matchedPath.params.gameid) || null

  const socket = useRef(null)
  const [auth, setAuth] = useState(null)
  const [state, dispatch] = useReducer(reducer, null, getInitialState)
  useEffect(() => {
    if (!auth) {
      console.log('Doing nothing for now, auth info not loaded')
      console.log(auth)
    }
    else {
      console.log("application effect creating socket")
      socket.current = io({transports: ["websocket"], query: {token: auth.token}})
      socket.current.on('connect', () => {
        dispatch({type: 'connect'})
      })
      socket.current.on('disconnect', () => {
        dispatch({type: 'disconnect'})
      })
      socket.current.on('client_error', (error) => {
        dispatch({type: 'client_error', error})
      })
      socket.current.on('games_list', ({ gamelist }) => {
        dispatch({type: 'games_list', gamelist})
      })
      socket.current.on('game_status', ({ gameid, status }) => {
        dispatch({type: 'game_status', gameid, status})
      })
      socket.current.on('update_full', ({ gameid, history, prompts }) => {
        dispatch({type: 'update_full', gameid, history, prompts})
      })
      socket.current.on('update_step', ({ gameid, index, step, prompts }) => {
        dispatch({type: 'update_step', gameid, index, step, prompts})
      })
      return (() => {
        console.log("master socket cleaning up...")
        socket.current.close()
      })
    }
  }, [auth])

  const openLobby = useCallback(() => {
    socket.current.emit('open_lobby')
    dispatch({type: 'open_lobby'})
  }, [])

  const closeLobby = useCallback(() => {
    socket.current.emit('close_lobby')
    dispatch({type: 'close_lobby'})
  }, [])

  const openGame = useCallback(() => {
    socket.current.emit('open_game', {gameid: currentGameid})
    dispatch({type: 'open_game', gameid: currentGameid})
  }, [currentGameid])

  const closeGame = useCallback(() => {
    socket.current.emit('close_game', {gameid: currentGameid})
    dispatch({type: 'close_game', gameid: currentGameid})
  }, [currentGameid])

  // handler functions to dispatch to reducer
  const setShownStep = useCallback((shownStep) => {
    dispatch({type: 'set_shown_step', shownStep})
  }, [])

  const resetShownStep = useCallback(() => {
    dispatch({type: 'reset_shown_step'})
  }, [])

  // handler functions which write straight to socket
  const joinGame = useCallback((gameid) => {
    socket.current.emit('join_game', {gameid})
  })

  const submitGameAction = useCallback((action) => {
    socket.current.emit('game_action', {gameid: currentGameid, action})
  }, [currentGameid])

  const handler = useMemo(() => ({
    setShownStep,
    resetShownStep,
    joinGame,
    submitGameAction
  }))

  if (state.error) {
    return <div>Client error: {state.error}</div>
  }

  return  <>
            <handlerContext.Provider value={handler}>
              <NavBar auth={auth} setAuth={setAuth} isConnected={state.connected} />
              <Switch>
                <Route exact path="/play/lobby">
                  <LobbyClient auth={auth} lobby={state.lobby} openLobby={openLobby} closeLobby={closeLobby} isConnected={state.connected} />
                </Route>
                <Route path={gameRoutePath} render = {
                  ({ match }) =>
                    <GameClient
                      gameid={match.params.gameid}
                      auth={auth}
                      game={state.game}
                      openGame={openGame}
                      closeGame={closeGame}
                      isConnected={state.connected} />
                } />
                <Route><Redirect to="/404" /></Route>
              </Switch>
            </handlerContext.Provider>
          </>
};

export default withRouter(Application);
