import React from 'react';
import ButtonRow from './ButtonRow'

function PromptBox(props) {
  let buttonRow = null
  let text = "Waiting ..."
  if (props.prompts.history) {
    buttonRow = <div className="para"><button onClick={props.prompts.history}>Back to the present</button></div>
    text = "(Viewing game history.)"
  }
  else if (props.prompts.buttons && props.prompts.buttons.length > 0) {
    buttonRow = <div className="para"><ButtonRow moves={props.prompts.buttons} /></div>
    text = "Your turn to act."
  }
  return (<>
            <p>{text}</p>
            {buttonRow}
          </>)
}

export default PromptBox
