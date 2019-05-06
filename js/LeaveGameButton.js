import React from 'react'
import { useHandler } from './handler'

function LeaveGameButton(props) {
  const handler = useHandler()
  return (<button onClick={() => {
            handler.leaveGame()
            handler.goToLobby()
          }}>
            Leave
          </button>)
};

export default LeaveGameButton;
