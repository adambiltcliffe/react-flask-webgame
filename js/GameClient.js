import './vendor/json_delta'
import React, { Suspense, useEffect } from 'react'
import DefaultRenderer from './DefaultRenderer'
import GameLog from './GameLog';

const CardGameRenderer = React.lazy(() => import('./examplecardgame/CardGameRenderer'))

function GameClient(props) {
  if (!props.game || !props.game.loaded) {
    return <div>Loading game ...</div>
  }

  let renderer;
  const currentGame = props.game.states[props.game.shownStep]
  const passedPrompts = (!props.isConnected) ? {text: 'Disconnected from server.'} :
                        (props.game.shownStep == props.game.states.length - 1) ? props.game.prompts :
                        {history: true, text: '(Viewing game history.)'}
  switch(currentGame.game_type) {
    case 'example_card':
      renderer = <CardGameRenderer game={currentGame} userid={props.auth.userid} prompts={passedPrompts} dispatchAction={props.dispatchAction} />
      break;
    default:
      renderer = <DefaultRenderer game={currentGame} userid={props.auth.userid} prompts={passedPrompts} dispatchAction={props.dispatchAction} />
  }
  return (<>
            <Suspense fallback={<div>Loading client ...</div>}>
              {renderer}
            </Suspense>
            <GameLog history={props.game.history} shownStep={props.game.shownStep}/>
          </>)
}

export default GameClient;
