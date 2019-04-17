import React from 'react'
import { Link } from 'react-router-dom'

function GameLobbyEntry(props) {
  let link = null
  if (props.state.status != 'WAIT' && props.state.status != 'READY') {
    const verb = props.state.players.includes(props.userid) ? "Play!" : "Watch"
    link = <Link to={`/play/game/${props.gameid}`}>{verb}</Link>
  }

  return <li key={props.gameid}>{JSON.stringify(props.state)} {link}</li>
};

export default GameLobbyEntry
