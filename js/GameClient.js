import './vendor/json_delta'
import React, { useCallback, useEffect } from 'react'
import CardGameRenderer from './examplecardgame/CardGameRenderer'
import DefaultRenderer from './DefaultRenderer'
import GameLog from './GameLog';

function GameClient(props) {
  useEffect(() => {
    if(props.isConnected) {
      props.openGame(props.gameid)
      return (() => {
        props.closeGame(props.gameid)
      })
    }
    else { return undefined } // we didn't actually open it
  }, [props.isConnected])

  const setShownStep = useCallback((step) => {
    props.setShownStep(props.gameid, step)
  }, [props.setShownStep, props.gameid])

  const resetShownStep = useCallback(() => {
    props.resetShownStep(props.gameid)
  }, [props.resetShownStep, props.gameid])

  const dispatchAction = useCallback((action) => {
    props.dispatchAction(props.gameid, action)
  }, [props.gameid])

  // Now render
  if (!props.game || !props.game.loaded) {
    return <div>Loading game ...</div>
  }

  let renderer;
  const currentGame = props.game.states[props.game.shownStep]
  const passedPrompts = (props.game.shownStep == props.game.states.length - 1) ? props.game.prompts : {history: resetShownStep}
  switch(currentGame.game_type) {
    case 'example_card':
      renderer = <CardGameRenderer game={currentGame} prompts={passedPrompts} dispatchAction={dispatchAction} />
      break;
    default:
      renderer = <DefaultRenderer game={currentGame} prompts={passedPrompts} dispatchAction={dispatchAction} />
  }
  return (<>
            {renderer}
            <GameLog history={props.game.history} shownStep={props.game.shownStep} setShownStep={setShownStep}/>
          </>)
}

export default GameClient;
