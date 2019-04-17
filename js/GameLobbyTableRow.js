import React from 'react'
import { Link } from 'react-router-dom'

function GameLobbyTableRow(props) {
  let link = null
  if (props.state.status != 'WAIT' && props.state.status != 'READY') {
    const verb = (props.state.players.includes(props.userid) && props.state.status != 'END') ? "Play!" : "View"
    link = <Link to={`/play/game/${props.gameid}`}>{verb}</Link>
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
