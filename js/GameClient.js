import './vendor/json_delta'
import React, { useCallback, useEffect } from 'react'
import CardGameRenderer from './examplecardgame/CardGameRenderer'
import DefaultRenderer from './DefaultRenderer'
import GameLog from './GameLog';

function GameClient(props) {
  useEffect(() => {
    if(props.isConnected) {
      props.openGame()
      return (() => {
        props.closeGame()
      })
    }
    else { return undefined } // we didn't actually open it
  }, [props.isConnected])

  // Now render
  if (!props.game || !props.game.loaded) {
    return <div>Loading game ...</div>
  }

  let renderer;
  const currentGame = props.game.states[props.game.shownStep]
  const passedPrompts = (props.game.shownStep == props.game.states.length - 1) ? props.game.prompts : {history: props.resetShownStep}
  switch(currentGame.game_type) {
    case 'example_card':
      renderer = <CardGameRenderer game={currentGame} prompts={passedPrompts} dispatchAction={props.dispatchAction} />
      break;
    default:
      renderer = <DefaultRenderer game={currentGame} prompts={passedPrompts} dispatchAction={props.dispatchAction} />
  }
  return (<>
            {renderer}
            <GameLog history={props.game.history} shownStep={props.game.shownStep} setShownStep={props.setShownStep}/>
          </>)
}

export default GameClient;
