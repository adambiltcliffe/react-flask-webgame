import React from 'react'
import { Link } from 'react-router-dom'

function GameLobbyEntry(props) {
  const verb = props.status.players.includes(props.userid) ? "Play!" : "Watch"
  return <li key={props.gameid}>{JSON.stringify(props.status)}<Link to={`/play/game/${props.gameid}`}>{verb}</Link></li>
};

export default GameLobbyEntry
