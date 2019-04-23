import React from 'react';
import PromptBox from './PromptBox';

function DefaultRenderer(props) {

  const textRows = Object.entries(props.game).map(([k, v]) => { return <li key={k}>{k}: {JSON.stringify(v)}</li> })
  textRows.sort()
  return (<>
            <p>Note: this game is being rendered in text mode as no specialised renderer is implemented.</p>
            <ul>
              {textRows}
            </ul>
            <PromptBox prompts={props.prompts} />
          </>)
}

export default DefaultRenderer
