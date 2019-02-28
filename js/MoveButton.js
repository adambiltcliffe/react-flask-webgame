import React from 'react';

function MoveButton(props) {
  return (<button key={props.moveName} onClick={() => props.send('make_move', {move: props.moveName, gameid: props.gameid})}>
            {props.moveName}
          </button>)
};

export default MoveButton;
