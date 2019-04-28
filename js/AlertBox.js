import React from 'react'
import { useHandler } from './handler'

const AlertBox = (props) => {
  const handler = useHandler()
  if (props.alerts.length == 0) {
    return null
  }
  function dismiss(index) {
    handler.dismissAlert(index)
  }
  return (
    <div className="floating-alert">
      {props.alerts.map((str, index) => <div key={str} onClick={() => dismiss(index)}>{str}</div>)}
    </div>
  )
}

export default AlertBox
