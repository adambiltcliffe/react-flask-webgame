import React from 'react';

function GameLog(props) {
  const entries = props.history.map((obj, ix) => {
    let cssClass = "game-history-entry" + ((ix == props.shownStep) ? "-shown" : "")
    return <div className={cssClass} key={ix} onClick={() => {props.setShownStep(ix)}}>{obj.text}</div>
  })
  return (<div className="game-history">
            Game log:
            {entries}
          </div>);
}

export default GameLog;
