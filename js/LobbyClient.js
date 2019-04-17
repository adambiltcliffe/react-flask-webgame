import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import GameLobbyTableRow from './GameLobbyTableRow'

function LobbyClient(props) {
  const [isConnected, setConnected] = useState(false)
  const [isLoaded, setLoaded] = useState(false)
  const [socket, setSocket] = useState(null)
  const [games, setGames] = useState({})

  // Side effects
  useEffect(() => {
    const sock = io('/lobby', {transports: ["websocket"], query: {token: props.auth.token}})
    sock.on('connect', () => {
      console.log('connected!!')
      setConnected(true)
    })
    sock.on('games_list', (data) => {
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
  }, [props.auth])

  // Now render
  if (!isLoaded) {
    return <div>Loading lobby ...</div>
  }
  return (<table>
            <thead><tr>
              <th>ID</th>
              <th>Game</th>
              <th>Players</th>
              <th>Status</th>
              <th>Active player</th>
              <th />
            </tr></thead>
            <tbody>
              {Object.entries(games).map(([id, state]) => <GameLobbyTableRow key={id} userid={props.auth.userid} gameid={id} state={state} />)}
            </tbody>
          </table>)
}

export default LobbyClient;
