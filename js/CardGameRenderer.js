import React from 'react';
import ButtonRow from './ButtonRow';
import CardGameTextBox from './CardGameTextBox';

function CardGameRenderer(props) {
  let buttonRow = null;
  console.log(props)
  if (props.prompts.buttons) {
    buttonRow = <ButtonRow moves={props.prompts.buttons} dispatchAction={props.dispatchAction} />
  }
  return (<>
            <CardGameTextBox game={props.game} />
            {buttonRow}
          </>)
}

export default CardGameRenderer
