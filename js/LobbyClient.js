import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

function LobbyClient(props) {
  const [isConnected, setConnected] = useState(false)
  const [isLoaded, setLoaded] = useState(false)
  const [socket, setSocket] = useState(null)
  const [games, setGames] = useState({})

  // Side effects
  useEffect(() => {
    const sock = io('/lobby', {transports: ["websocket"], query: {foo: "bar"}})
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
      sock.disconnect()
    }
  }, [])

  // Now render
  if (!isLoaded) {
    return <div>Loading lobby ...</div>
  }
  const gamelist = Object.entries(games).map(([id, status]) => <li key={id}>{JSON.stringify(status)}<Link to={`/play/game/${id}`}>Play!</Link></li>)
  return (<div>
    <p>Current game list: {JSON.stringify(games)}.</p>
    <ul>
        {gamelist}
    </ul>
  </div>);
}

export default LobbyClient;
