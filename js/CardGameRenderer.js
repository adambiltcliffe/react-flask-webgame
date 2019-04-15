import React from 'react';
import PromptBox from './PromptBox';
import CardGameTextBox from './CardGameTextBox';

function CardGameRenderer(props) {

  return (<>
            <CardGameTextBox game={props.game} prompts={props.prompts} dispatchAction={props.dispatchAction} />
            <PromptBox prompts={props.prompts} dispatchAction={props.dispatchAction} />
          </>)
}

export default CardGameRenderer
