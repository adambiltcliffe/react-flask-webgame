import React, { useEffect, useState } from 'react';
import ButtonRow from './ButtonRow'
import CardGameTextBox from './CardGameTextBox'
import GameLog from './GameLog'
import io from 'socket.io-client';

function GameClient(props) {
  const [isConnected, setConnected] = useState(false)
  const [isLoaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [socket, setSocket] = useState(null)
  const [game, setGame] = useState({})
  const [history, setHistory] = useState([])

  function sendMessage(message, data) {
    socket.emit(message, data)
  }

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
      console.log('Received update')
      console.log(JSON.stringify(data))
      let gameid, state, newHistory
      ({ gameid, state, history: newHistory } = data)
      if (gameid == props.gameid) {
        setHistory(newHistory)
        console.log("Here comes the past!")
        let computedState = {}
        newHistory.map((obj) => {computedState = {...computedState, ...(obj.state)}})
        console.log('Received state:', state)
        console.log('Computed state:', computedState)
        setGame(computedState)
        setLoaded(true)
      }
      else {
        console.log('Ignoring it ...')
      }
    })
    sock.on('update_step', (data) => {
      console.log('Received update')
      console.log(JSON.stringify(data))
      let gameid, index, step, currentHistory, currentGame
      ({ gameid, index, step } = data)
      // get the current value at the time the handler is called
      setHistory((h) => {currentHistory = h; return h})
      setGame((g) => {currentGame = g; return g})
      if (gameid == props.gameid && index == currentHistory.length) {
        setHistory(currentHistory.concat([step]))
        console.log("Taking a step")
        setGame({...currentGame, ...step.state})
      }
      else {
        console.log('Ignoring it ...')
      }
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
  var buttonRow = null;
  if (game.my_moves) {
    buttonRow = <ButtonRow moves={game.my_moves} send={sendMessage} gameid={props.gameid} />
  }
  return (<div>
    <CardGameTextBox game={game} />
    {buttonRow}
    <GameLog history={history} />
    {/* <p>All props: {JSON.stringify(props)}</p> */}
  </div>);
}

export default GameClient;
