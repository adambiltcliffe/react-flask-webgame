import React from 'react';

function MoveButton(props) {
  return (<button key={props.moveName} onClick={() => props.send('game_action', {action: props.moveName, gameid: props.gameid})}>
            {props.moveName}
          </button>)
};

export default MoveButton;
