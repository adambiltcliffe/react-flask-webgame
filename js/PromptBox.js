import React from 'react';
import ButtonRow from './ButtonRow'
import { useHandler } from './handler'

function PromptBox(props) {
  const handler = useHandler()
  let buttonRow = null
  if (props.prompts.history) {
    buttonRow = <div className="para"><button onClick={handler.resetShownStep}>Back to the present</button></div>
  }
  else if (props.prompts.buttons && props.prompts.buttons.length > 0) {
    buttonRow = <div className="para"><ButtonRow moves={props.prompts.buttons} /></div>
  }
  return (<>
            <p>{props.prompts.text}</p>
            {buttonRow}
          </>)
}

export default PromptBox
