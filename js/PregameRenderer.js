import React, { Suspense, useCallback, useRef, useState } from 'react'
import { useHandler } from './handler'
import LeaveGameButton from './LeaveGameButton'

const CardGamePlayerOptions = React.lazy(() => import('./examplecardgame/CardGamePlayerOptions'))

const PregameRenderer = (props) => {
  const readyRef = useRef(null)
  const handler = useHandler()
  const [opts, setOpts] = useState(props.game.opts)
  const onReadyChanged = useCallback(() => { handler.submitReady({...opts, ready: readyRef.current.checked}) })
  const playerList = props.game.info.players.map((p) => <li key={p}>{props.game.info.playernicks[p]}: {props.game.ready[p]?'':'not '}ready</li>)
  let optsChooser = null
  const disabled = readyRef.current && readyRef.current.checked
  switch (props.game.info.game_type) {
    case 'example_card':
      optsChooser = <CardGamePlayerOptions disabled={disabled} opts={opts} setOpts={setOpts} />
      break
    default:
      optsChooser = <>
        <p>Note: this game is using the default pregame renderer, which does not allow you to modify pregame options.</p>
        <p>Pregame options: {JSON.stringify(props.game.opts)}</p>
      </>
  }
  return <>
          <p>Waiting for game to start ...</p>
          <ul>{playerList}</ul>
          <Suspense fallback={<div>Loading options ...</div>}>
            {optsChooser}
          </Suspense>
          <p>Ready? <input type="checkbox" defaultChecked={props.game.opts.ready} ref={readyRef} onChange={onReadyChanged} /></p>
          <LeaveGameButton />
         </>
}

export default PregameRenderer
