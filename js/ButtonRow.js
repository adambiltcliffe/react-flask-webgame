import React from 'react';
import MoveButton from './MoveButton'

function ButtonRow(props) {
  const buttons = props.moves.map((moveName) => <MoveButton key={moveName} send={props.send} moveName={moveName} />)
  return (<div>
            {buttons}
          </div>);
}

export default ButtonRow;
