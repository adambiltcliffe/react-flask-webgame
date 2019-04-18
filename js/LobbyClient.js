import React from 'react';
import GameLobbyTableRow from './GameLobbyTableRow'

function LobbyClient(props) {
  if (!props.lobby.loaded) {
    return (<div>Loading lobby ...</div>)
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
              {Object.entries(props.lobby.games).map(([id, state]) => <GameLobbyTableRow key={id} userid={props.auth.userid} gameid={id} state={state} />)}
            </tbody>
          </table>)
}

export default LobbyClient;
