import React, { useState } from 'react'
import MoveButton from './MoveButton'

function Card(props) {
  const [showChild, setShowChild] = useState(false)
  let popupMenu = null;
  let hasChild = props.prompt && props.prompt.length > 0
  let n = props.value
  let cssClass = (n == "?" ? "card-unknown" : "card-" + n) + (hasChild ? " clickable" : "")
  if (hasChild && showChild) {
    popupMenu = props.prompt.map((item) => {
      const [text, action] = item;
      return <div key={text}><MoveButton text={text} action={action} dismiss={() => setShowChild(false)} dispatchAction={props.dispatchAction} /></div>
    })
  }
  function toggleChild() {
    setShowChild((x) => !x)
  }
  return <span className="card-container">
            <span className={cssClass} onClick={hasChild ? toggleChild : undefined}>{n}</span>
            {popupMenu && <div className="card-popup">
              {popupMenu}
            </div>}
          </span>
}

export default Card;
