import React from 'react';
import MoveButton from './MoveButton'

function ButtonRow(props) {
  const buttons = props.moves.map((moveName) => <MoveButton key={moveName} dispatchAction={props.dispatchAction} moveName={moveName} gameid={props.gameid} />)
  return (<div>
            {buttons}
          </div>);
}

export default ButtonRow;
