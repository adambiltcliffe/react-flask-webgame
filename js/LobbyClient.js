import React from 'react';
import GameLobbyTableRow from './GameLobbyTableRow'

function LobbyClient(props) {
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
              {Object.entries(props.games).map(([id, state]) => <GameLobbyTableRow key={id} userid={props.auth.userid} gameid={id} state={state} />)}
            </tbody>
          </table>)
}

export default LobbyClient;
