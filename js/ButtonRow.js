import React from 'react';
import MoveButton from './MoveButton'

function ButtonRow(props) {
  const buttons = props.moves.map((actionDesc) => {
    let text, action;
    [text, action] = actionDesc;
    return (<MoveButton key={action} dispatchAction={props.dispatchAction} text={text} action={action} />)
  })
  return (<div>
            {buttons}
          </div>);
}

export default ButtonRow;
