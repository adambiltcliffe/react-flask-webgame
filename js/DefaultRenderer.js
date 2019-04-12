import React from 'react';
import ButtonRow from './ButtonRow';

function DefaultRenderer(props) {
  let buttonRow = null;
  if (props.prompts.buttons) {
    buttonRow = <div className="para"><ButtonRow moves={props.prompts.buttons} dispatchAction={props.dispatchAction} /></div>
  }
  const textRows = Object.entries(props.game).map(([k, v]) => { return <li key={k}>{k}: {JSON.stringify(v)}</li> })
  textRows.sort()
  return (<>
            <p>Note: this game is being rendered in text mode as no specialised renderer is implemented.</p>
            <ul>
              {textRows}
            </ul>
            {buttonRow}
          </>)
}

export default DefaultRenderer
