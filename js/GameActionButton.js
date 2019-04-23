import React from 'react'
import { useHandler } from './handler'

function GameActionButton(props) {
  const handler = useHandler()
  return (<button onClick={() => {
            props.dismiss && props.dismiss()
            handler.submitGameAction(props.action)
          }}>
            {props.text}
          </button>)
};

export default GameActionButton;
