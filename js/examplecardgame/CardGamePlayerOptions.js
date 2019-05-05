import React, { useCallback, useRef } from 'react'

const CardGamePlayerOptions = (props) => {
  const specialCardRef = useRef(null)
  const handleChange = useCallback(() => {
    props.setOpts((opts) => ({...opts, special_card: parseInt(specialCardRef.current.value)}))
  }, [props.setOpts])
  if (props.opts.special_card !== undefined) {
    return <select name="special_card" ref={specialCardRef} value={props.opts.special_card} disabled={props.disabled} onChange={handleChange}>
              <option value="0">Start with a zero</option>
              <option value="6">Start with a six</option>
            </select>
  }
  return null
}

export default CardGamePlayerOptions
