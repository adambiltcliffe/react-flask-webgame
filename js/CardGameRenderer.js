import React from 'react';
import ButtonRow from './ButtonRow';
import CardGameTextBox from './CardGameTextBox';
import GameLog from './GameLog';

function CardGameRenderer(props) {
  let buttonRow = null;
  if (props.game.my_moves) {
    buttonRow = <ButtonRow moves={props.game.my_moves} send={props.sendMessage} gameid={props.gameid} />
  }
  return (<>
            <CardGameTextBox game={props.game} />
            {buttonRow}
            <GameLog history={props.history} />
          </>)
}

export default CardGameRenderer
