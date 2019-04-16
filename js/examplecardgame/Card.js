import React, { useCallback, useState } from 'react'
import MoveButton from '../MoveButton'
import PopupMenu from './PopupMenu'

function Card(props) {
  const [showChild, setShowChild] = useState(false)
  let popupMenuContent = null;
  let hasChild = props.prompt && props.prompt.length > 0
  let n = props.value
  let cssClass = (n == "?" ? "card-unknown" : "card-" + n) + (hasChild ? " clickable" : "")
  const toggleChild = useCallback(() => {
    setShowChild((x) => !x)
  }, [])
  const hideChild = useCallback(() => {
    setShowChild(false)
  } , [])
  if (hasChild && showChild) {
    popupMenuContent = props.prompt.map((item) => {
      const [text, action] = item;
      return <div key={text}><MoveButton text={text} action={action} dismiss={hideChild} dispatchAction={props.dispatchAction} /></div>
    })
  }
  return <span className="card-container">
            <span className={cssClass} onClick={hasChild ? toggleChild : undefined}>{n}</span>
            {popupMenuContent && <PopupMenu dismiss={hideChild}>
              {popupMenuContent}
            </PopupMenu>}
          </span>
}

export default Card;
