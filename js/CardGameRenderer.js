import React from 'react';
import ButtonRow from './ButtonRow';
import CardGameTextBox from './CardGameTextBox';

function CardGameRenderer(props) {
  let buttonRow = null;
  console.log(props)
  if (props.prompts.buttons) {
    buttonRow = <div className="para"><ButtonRow moves={props.prompts.buttons} dispatchAction={props.dispatchAction} /></div>
  }
  return (<>
            <CardGameTextBox game={props.game} prompts={props.prompts} dispatchAction={props.dispatchAction} />
            {buttonRow}
          </>)
}

export default CardGameRenderer
