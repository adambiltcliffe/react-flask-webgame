import React, { useEffect } from 'react';
import GameLobbyTableRow from './GameLobbyTableRow'
import CreateGameForm from './CreateGameForm'

function LobbyClient(props) {
  useEffect(() => {
    if(props.isConnected) {
      props.openLobby()
      return (() => {
        props.closeLobby()
      })
    }
    else { return undefined } // we didn't actually open it
  }, [props.isConnected])
  if (!props.lobby.loaded) {
    return (<div>Loading lobby ...</div>)
  }
  return (<>
            <table>
              <thead><tr>
                <th>ID</th>
                <th>Game</th>
                <th>Players</th>
                <th>Status</th>
                <th>Active player</th>
                <th />
              </tr></thead>
              <tbody>
                {Object.entries(props.lobby.games).map(([id, state]) => <GameLobbyTableRow key={id} userid={props.auth.userid} gameid={id} state={state} isConnected={props.isConnected} />)}
              </tbody>
            </table>
            {props.auth.token && <CreateGameForm />}
          </>)
}

export default LobbyClient;
