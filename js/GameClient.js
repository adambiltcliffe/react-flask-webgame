import './vendor/json_delta'
import React, { useCallback, useEffect, useState } from 'react'
import CardGameRenderer from './CardGameRenderer'
import DefaultRenderer from './DefaultRenderer'
import GameLog from './GameLog';
import io from 'socket.io-client'

function nonDestructivePatch(oldStruc, patch) {
  /* This is inefficient and should eventually be fixed by rewriting JSON_delta */
  const newStruc = JSON.parse(JSON.stringify(oldStruc))
  return JSON_delta.patch(newStruc, patch)
}

function GameClient(props) {
  const [isConnected, setConnected] = useState(false)
  const [isLoaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [socket, setSocket] = useState(null)
  const [game, setGame] = useState({})
  const [history, setHistory] = useState([])
  const [prompts, setPrompts] = useState([])

  const dispatchAction = useCallback((action_data) => {
    socket.emit('game_action', {action: action_data, gameid: props.gameid})
  }, [socket, props.gameid])

  // Side effects
  useEffect(() => {
    const sock = io('/game', {transports: ["websocket"], query: {token: props.authToken}})
    sock.on('connect', () => {
      console.log('connected!!')
      setConnected(true)
      console.log('requesting load')
      sock.emit('open_game', {gameid: props.gameid})
    })
    sock.on('update_full', (data) => {
      let gameid, newHistory, newPrompts
      ({ gameid, history: newHistory, prompts: newPrompts } = data)
      if (gameid == props.gameid) {
        setHistory(newHistory)
        let computedState = {}
        newHistory.map((obj) => {computedState = nonDestructivePatch(computedState, obj.delta)})
        setGame(computedState)
        setPrompts(newPrompts)
        setLoaded(true)
      }
    })
    sock.on('update_step', (data) => {
      console.log(JSON.stringify(data))
      let gameid, index, step, newPrompts, currentHistory, currentGame
      ({ gameid, index, step, prompts: newPrompts } = data)
      // get the current value at the time the handler is called
      setHistory((h) => {currentHistory = h; return h})
      setGame((g) => {currentGame = g; return g})
      if (gameid == props.gameid && index == currentHistory.length) {
        setHistory(currentHistory.concat([step]))
        setGame(nonDestructivePatch(currentGame, step.delta))
      }
      setPrompts(newPrompts)
    })
    sock.on('client_error', (msg) => {
      console.log('Received client error: ' + msg)
      setError(msg)
    })
    setSocket(sock)
    return function cleanup() {
       sock.disconnect()
    }
  }, [props.gameid, props.authToken])

  // Now render
  if (error) {
    return <div>Client error: {error}</div>
  }
  if (!isLoaded) {
    return <div>Loading game ...</div>
  }
  let renderer;
  switch(game.game_type) {
    case 'example_card':
      renderer = <CardGameRenderer game={game} prompts={prompts} dispatchAction={dispatchAction} />
      break;
    default:
      renderer = <DefaultRenderer game={game} prompts={prompts} dispatchAction={dispatchAction} />
  }
  return (<>
            {renderer}
            <GameLog history={history} />
          </>)
}

export default GameClient;
