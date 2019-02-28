import React, { useEffect } from 'react';
import ButtonRow from './ButtonRow'

function GameClient(props) {
  useEffect(() => {
    if (props.clientState.isConnected && !props.clientState.isLoaded && !props.clientState.error) {
      props.send('load_game', {gameid: props.gameid})
    }
  })
  if (props.clientState.error) {
    return <div>Client error: {props.clientState.error}</div>
  }
  if (!props.clientState.isLoaded) {
    return <div>Loading game ...</div>
  }
  var buttonRow = null;
  if (props.game.moves) {
    buttonRow = <ButtonRow moves={props.game.moves} send={props.send} gameid={props.gameid} />
  }
  return (<div>
    <p>Current game state: {JSON.stringify(props.game)}.</p>
    {buttonRow}
    <p>All props: {JSON.stringify(props)}</p>
  </div>);
}

export default GameClient;
