import React from 'react';
import Card from './Card';

function CardGameTextBox(props) {
  let pix = props.game.my_player_index
  let playerList
  if (pix !== null) {
    playerList = props.game.players[pix] + ' (you) vs. ' + props.game.players[1 - pix]
  }
  else {
    playerList = props.game.players[0] + ' vs. ' + props.game.players[1]
  }
  let stack = props.game.stack.map((n, idx) => { return <Card key={idx} value={n} /> })
  let otherHands = Object.entries(props.game.hand_counts).map((kv) => {
    const [k, v] = kv
    if (props.game.players[props.game.my_player_index] == k) { return null }
    let hiddenCards = [];
    for (let i=0; i<v; i++) {
      hiddenCards.push(<Card key={i} value="?" />)
    }
    return <div className="para" key={k}>{k}: {hiddenCards}</div>
  })
  let myHand = null;
  if (props.game.my_hand) {
    myHand = <div className="para">You: {props.game.my_hand.map((n, idx) => {
      return <Card key={idx} value={n} />
    })}</div>
  }
  let winnerInfo = null;
  if (props.game.winner) {
    winnerInfo = <p className="winner-info">{props.game.winner} is the winner!</p>
  }
  return (<>
            <p>{playerList}</p>
            <p>Current player: {props.game.turn}</p>
            <div>Played cards: {stack} (Total: {props.game.current_total})</div>
            <p>{props.game.deck_count} cards in deck.</p>
            <div className="boxed">
              <p>Cards in hand</p>
              {otherHands}
              {myHand}
            </div>
            {winnerInfo}
          </>);
}

export default CardGameTextBox;
