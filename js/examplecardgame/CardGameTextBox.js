import React from 'react';
import Card from './Card';

function CardGameTextBox(props) {
  let pix = props.game.my_player_index
  let playerList
  if (pix !== undefined) {
    playerList = props.game.playernicks[props.game.players[pix]] + ' (you) vs. ' + props.game.playernicks[props.game.players[1 - pix]]
  }
  else {
    playerList = props.game.playernicks[props.game.players[0]] + ' vs. ' + props.game.playernicks[props.game.players[1]]
  }
  let stack = props.game.stack.map((n, idx) => { return <Card key={idx} value={n} /> })
  let otherHands = Object.entries(props.game.hand_counts).map(([k, v]) => {
    if (props.game.players[props.game.my_player_index] == k) { return null }
    let hiddenCards = [];
    for (let i=0; i<v; i++) {
      hiddenCards.push(<Card key={i} value="?" />)
    }
    return <div className="para" key={k}>{props.game.playernicks[k]}: {hiddenCards}</div>
  })
  let myHand = null;
  if (props.game.my_hand) {
    myHand = <div className="para">You: {props.game.my_hand.map((n, idx) => {
      return <Card key={idx} value={n} prompt={props.prompts.hand_card && props.prompts.hand_card[n]} dispatchAction={props.dispatchAction} />
    })}</div>
  }
  let viewedCards = null;
  if (props.game.viewing) {
    viewedCards = <div className="para">Top cards of deck: {props.game.viewing.map((n, idx) => {
      return <Card key={idx} value={n} prompt={props.prompts.viewed_card && props.prompts.viewed_card[n]} dispatchAction={props.dispatchAction} />
    })}</div>
  }
  let winnerInfo = null;
  if (props.game.winner) {
    winnerInfo = <p className="winner-info">{props.game.winner} is the winner!</p>
  }
  return (<>
            <p>{playerList}</p>
            <p>Current player: {props.game.playernicks[props.game.turn]}</p>
            <div>Played cards: {stack} (Total: {props.game.current_total})</div>
            <p>{props.game.deck_count} cards in deck.</p>
            <div className="boxed">
              <p>Cards in hand</p>
              {otherHands}
              {myHand}
              {viewedCards}
            </div>
            {winnerInfo}
          </>);
}

export default CardGameTextBox;
