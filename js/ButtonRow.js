import React from 'react';
import GameActionButton from './GameActionButton'

function ButtonRow(props) {
  const buttons = props.moves.map(([text, action]) => <GameActionButton key={action} text={text} action={action} />)
  return (<div>
            {buttons}
          </div>);
}

export default ButtonRow;
