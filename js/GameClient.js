import React from 'react';
import ButtonRow from './ButtonRow'

function GameClient(props) {
  var buttonRow = null;
  if (props.board.moves) {
    buttonRow = <ButtonRow moves={props.board.moves} send={props.send} />
  }
  return (<div>
    <p>Current game state: {JSON.stringify(props.board)}.</p>
    {buttonRow}
  </div>);

}

export default GameClient;
