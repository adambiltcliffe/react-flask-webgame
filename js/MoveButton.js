import React from 'react';

function MoveButton(props) {
  return (<button key={props.moveName} onClick={() => props.send(props.moveName)}>
            {props.moveName}
          </button>)
};

export default MoveButton;
