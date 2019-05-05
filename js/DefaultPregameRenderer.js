import React, { useCallback, useRef } from 'react'
import { useHandler } from './handler'

const DefaultPregameRenderer = (props) => {
  const readyRef = useRef(null)
  const handler = useHandler()
  const onReadyChanged = useCallback(() => { handler.submitReady({...props.game.opts, ready: readyRef.current.checked}) })
  console.log(props)
  const playerList = props.game.info.players.map((p) => <li key={p}>{p}: {props.game.ready[p]?'':'not '}ready</li>)
  return <>
          <p>Waiting for game to start ...</p>
          <p>Note: this game is using the default pregame renderer, which does not allow you to modify pregame options.</p>
          <ul>{playerList}</ul>
          <p>Pregame options: {JSON.stringify(props.game.opts)}</p>
          <p>Ready? <input type="checkbox" ref={readyRef} onChange={onReadyChanged} /></p>
         </>
}

export default DefaultPregameRenderer
