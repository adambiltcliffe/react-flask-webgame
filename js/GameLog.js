import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHandler } from './handler'

function GameLog(props) {
  const handler = useHandler()
  const bottomElement = useRef()
  const [scrolledUp, setScrolledUp] = useState(false)
  const onScroll = useCallback((e) => {
    setScrolledUp(e.target.scrollHeight - e.target.scrollTop !== e.target.clientHeight)
  })
  useEffect(() => { if (!scrolledUp) { bottomElement.current.scrollIntoView() }})
  const entries = props.history.map((obj, ix) => {
    const cssClass = "game-history-entry" + ((ix == props.shownStep) ? "-shown" : "")
    const ref = (ix == props.history.length - 1) ? bottomElement : undefined
    return <div className={cssClass} ref={ref} key={ix} onClick={() => {handler.setShownStep(ix)}}>{obj.text}</div>
  })
  return (<div onScroll={onScroll} className="game-history">
            Game log:
            {entries}
          </div>);
}

export default GameLog;
