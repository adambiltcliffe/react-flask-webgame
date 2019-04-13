import React from 'react';

function MoveButton(props) {
  return (<button onClick={() => props.dispatchAction(props.action)}>
            {props.text}
          </button>)
};

export default MoveButton;
