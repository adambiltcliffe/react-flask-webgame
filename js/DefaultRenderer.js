import React from 'react';
import ButtonRow from './ButtonRow';
import GameLog from './GameLog';

function CardGameRenderer(props) {
  let buttonRow = null;
  if (props.game.my_moves) {
    buttonRow = <p><ButtonRow moves={props.game.my_moves} dispatchAction={props.dispatchAction} gameid={props.game.gameid} /></p>
  }
  const textRows = Object.entries(props.game).map(([k, v]) => { return <li key={k}>{k}: {JSON.stringify(v)}</li> })
  textRows.sort()
  return (<>
            <p>Note: this game is being rendered in text mode as no specialised renderer is implemented.</p>
            <ul>
              {textRows}
            </ul>
            {buttonRow}
            <GameLog history={props.history} />
          </>)
}

export default CardGameRenderer
