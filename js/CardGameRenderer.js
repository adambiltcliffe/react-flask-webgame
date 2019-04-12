import React from 'react';
import ButtonRow from './ButtonRow';
import CardGameTextBox from './CardGameTextBox';

function CardGameRenderer(props) {
  let buttonRow = null;
  if (props.game.my_moves) {
    buttonRow = <ButtonRow moves={props.game.my_moves} dispatchAction={props.dispatchAction} gameid={props.game.gameid} />
  }
  return (<>
            <CardGameTextBox game={props.game} />
            {buttonRow}
          </>)
}

export default CardGameRenderer
