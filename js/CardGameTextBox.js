import React from 'react';

function CardGameTextBox(props) {
  let pix = props.game.my_player_index
  let playerList
  if (pix !== null) {
    playerList = props.game.players[pix] + ' (you) vs. ' + props.game.players[1 - pix]
  }
  else {
    playerList = props.game.players[0] + ' vs. ' + props.game.players[1]
  }
  let otherHands = Object.entries(props.game.hand_counts).map((kv) => {
    const [k, v] = kv
    console.log(k, v)
    if (props.game.players[props.game.my_player_index] == k) { return null }
    return <p key={k}>{k} has {v} cards in hand.</p>
  })
  let myHand = null;
  if (props.game.my_hand) {
    myHand = <p>Your hand: {props.game.my_hand.map((n, idx) => {
      return <span key={idx} className={"card"+n}>{n}</span>
    })}</p>
  }
  let winnerInfo = null;
  if (props.game.winner) {
    winnerInfo = <p className="winner-info">{props.game.winner} is the winner!</p>
  }
  return (<>
            <p>{playerList}</p>
            <p>Current player: {props.game.turn}</p>
            <p>Played cards: {props.game.stack} (Total: {props.game.current_total})</p>
            <p>{props.game.deck_count} cards in deck.</p>
            {otherHands}
            {myHand}
            {winnerInfo}
          </>);
}

export default CardGameTextBox;
