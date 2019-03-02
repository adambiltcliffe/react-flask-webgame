import React, { useEffect, useState } from 'react';
import ButtonRow from './ButtonRow'
import io from 'socket.io-client';

function GameClient(props) {
  const [isConnected, setConnected] = useState(false)
  const [isLoadRequested, setLoadRequested] = useState(false)
  const [isLoaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [socket, setSocket] = useState(null)
  const [game, setGame] = useState({})

  function sendMessage(message, data) {
    socket.emit(message, data)
  }

  // Side effects
  useEffect(() => {
    const sock = io('/game')
    sock.on('connect', () => {
      console.log('connected!!')
      setConnected(true)
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
      // we can't access the (current) value of isLoadRequested inside the handler but we can do this ...
      setLoadRequested((lr) => {
        if (lr) {
          sock.emit('close_game', {gameid: props.gameid})
        }
        return lr
      })
      sock.disconnect()
    }
  }, [props.gameid])

  useEffect(() => {
    if (isConnected && !isLoadRequested) {
      console.log('requesting load')
      socket.emit('open_game', {gameid: props.gameid})
      setLoadRequested(true)
    }
  }, [isConnected, isLoadRequested])

  // Now render
  if (error) {
    return <div>Client error: {error}</div>
  }
  if (!isLoaded) {
    return <div>Loading game ...</div>
  }
  var buttonRow = null;
  if (game.moves) {
    buttonRow = <ButtonRow moves={game.moves} send={sendMessage} gameid={props.gameid} />
  }
  return (<div>
    <p>Current game state: {JSON.stringify(game)}.</p>
    {buttonRow}
    <p>All props: {JSON.stringify(props)}</p>
  </div>);
}

export default GameClient;
