import React from 'react'
import { useHandler } from './handler'

function JoinGameButton(props) {
  const handler = useHandler()
  return (<button onClick={() => {
            handler.joinGame(props.gameid)
          }}>
            Join
          </button>)
};

export default JoinGameButton;
