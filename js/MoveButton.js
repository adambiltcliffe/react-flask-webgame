import React from 'react';

function MoveButton(props) {
  return (<button key={props.moveName} onClick={() => props.dispatchAction(props.moveName)}>
            {props.moveName}
          </button>)
};

export default MoveButton;
