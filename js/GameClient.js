import React, { useEffect, useState } from 'react';
import ButtonRow from './ButtonRow'
import io from 'socket.io-client';

function GameClient(props) {
  const [isConnected, setConnected] = useState(false)
  const [isLoaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [socket, setSocket] = useState(null)
  const [game, setGame] = useState({})

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
    sock.on('update', (data) => {
      console.log('Received update')
      console.log(JSON.stringify(data))
      var gameid, state
      ({ gameid, state } = data)
      if (gameid == props.gameid) {
        setGame(state)
        setLoaded(true)
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
    <p>Current game state: {JSON.stringify(game)}.</p>
    {buttonRow}
    <p>All props: {JSON.stringify(props)}</p>
  </div>);
}

export default GameClient;
