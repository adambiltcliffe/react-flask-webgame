import React from 'react'
import { Link } from 'react-router-dom'
import JoinGameButton from './JoinGameButton'

function GameLobbyTableRow(props) {
  let link = null
  if (props.state.players.includes(props.userid)) {
    const verb = (props.state.status != 'END') ? "Play!" : "View"
    link = <Link to={`/play/game/${props.gameid}`}>{verb}</Link>
  }
  else if (props.state.status != 'WAIT' && props.state.status != 'READY') {
    link = <Link to={`/play/game/${props.gameid}`}>Watch</Link>
  }
  else if (props.state.status == 'WAIT' &&
      !props.state.players.includes(props.userid) &&
      props.isConnected &&
      props.userid) {
    link = <JoinGameButton gameid={props.gameid} />
  }
  const playerNames = props.state.players.map((userid) => props.state.playernicks[userid]).join(', ')
  return (<tr key={props.gameid}>
            <td>{props.gameid}</td>
            <td>{props.state.game_type}</td>
            <td>{playerNames}</td>
            <td>{props.state.status}</td>
            <td>{props.state.turn}</td>
            <td>{link}</td>
          </tr>)
};

export default GameLobbyTableRow
