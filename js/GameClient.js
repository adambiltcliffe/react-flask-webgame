import './vendor/json_delta'
import React, { useCallback, useEffect, useState } from 'react'
import CardGameRenderer from './examplecardgame/CardGameRenderer'
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
  const [gameStates, setGameStates] = useState({})
  const [shownStep, setShownStep] = useState(0)
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
        let computedStateArray = []
        newHistory.map((obj) => {
          computedState = nonDestructivePatch(computedState, obj.delta)
          computedStateArray.push(computedState)
        })
        setGameStates(computedStateArray)
        setPrompts(newPrompts)
        setShownStep(computedStateArray.length - 1)
        setLoaded(true)
      }
    })
    sock.on('update_step', (data) => {
      console.log(JSON.stringify(data))
      let gameid, index, step, newPrompts, currentHistory, currentGame
      ({ gameid, index, step, prompts: newPrompts } = data)
      // get the current value at the time the handler is called
      setHistory((h) => {currentHistory = h; return h})
      if (gameid == props.gameid && index == currentHistory.length) {
        setHistory(currentHistory.concat([step]))
        setGameStates((g) => {
          return g.concat(nonDestructivePatch(g[g.length-1], step.delta))
        })
      }
      setShownStep((step) => (step == currentHistory.length - 1) ? step + 1 : step)
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

  const resetShownStep = useCallback(() => { setShownStep(history.length - 1) }, [history])

  // Now render
  if (error) {
    return <div>Client error: {error}</div>
  }
  if (!isLoaded) {
    return <div>Loading game ...</div>
  }

  let renderer;
  const currentGame = gameStates[shownStep]
  const passedPrompts = (shownStep == gameStates.length - 1) ? prompts : {history: resetShownStep}
  switch(currentGame.game_type) {
    case 'example_card':
      renderer = <CardGameRenderer game={currentGame} prompts={passedPrompts} dispatchAction={dispatchAction} />
      break;
    default:
      renderer = <DefaultRenderer game={currentGame} prompts={passedPrompts} dispatchAction={dispatchAction} />
  }
  return (<>
            {renderer}
            <GameLog history={history} shownStep={shownStep} setShownStep={setShownStep}/>
          </>)
}

export default GameClient;
