import React from 'react';

function GameLog(props) {
  const entries = props.history.map((obj, ix) => <li key={ix} onClick={() => {props.setShownStep(ix)}}>{obj.text}</li>)
  return (<div>
            Game log:
            <ul>
              {entries}
            </ul>
          </div>);
}

export default GameLog;
