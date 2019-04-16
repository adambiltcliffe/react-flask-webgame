import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import GameLobbyEntry from './GameLobbyEntry'

function LobbyClient(props) {
  const [isConnected, setConnected] = useState(false)
  const [isLoaded, setLoaded] = useState(false)
  const [socket, setSocket] = useState(null)
  const [games, setGames] = useState({})

  // Side effects
  useEffect(() => {
    console.log(props)
    const sock = io('/lobby', {transports: ["websocket"], query: {token: props.auth.token}})
    sock.on('connect', () => {
      console.log('connected!!')
      setConnected(true)
    })
    sock.on('games_list', (data) => {
      console.log('Received games list')
      console.log(JSON.stringify(data))
      let gamelist
      ({ gamelist } = data)
      setGames(gamelist)
      setLoaded(true)
    })
    sock.on('game_status', (data) => {
      console.log('Received game status update: ' + JSON.stringify(data))
      let gameid, status
      ({gameid, status} = data)
      setGames((games) => {return {...games, [gameid]: status}})
    })
    setSocket(sock)
    return function cleanup() {
      console.log("Cleaning up...")
      sock.disconnect()
    }
  }, [props.authToken])

  // Now render
  if (!isLoaded) {
    return <div>Loading lobby ...</div>
  }
  return (<ul>{Object.entries(games).map(([id, status]) => <GameLobbyEntry key={id} userid={props.auth.userid} gameid={id} status={status} />)}</ul>)
}

export default LobbyClient;
