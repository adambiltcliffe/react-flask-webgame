import React, { useCallback, useRef, useState } from 'react'
import { useHandler } from './handler'

function CreateGameForm(props) {
  const numberRef = useRef(null)
  const useSpecialRef = useRef(false)
  const handler = useHandler()
  const [gameType, setGameType] = useState('example_card')

  const handleChangeGameType = useCallback((event) => {
    setGameType(event.target.value)
  })

  const handleCreateGame = useCallback((event) => {
    event.preventDefault()
    const conf = {}
    if (gameType == 'subtract_square') {
      conf.starting_number = parseInt(numberRef.current.value) || 0
    } else if (gameType == 'example_card') {
      conf.use_special_cards = useSpecialRef.current.checked
    }
    handler.createGame(gameType, conf)
  })

  return <form onSubmit={handleCreateGame}>
          <select name="type" onChange={handleChangeGameType} value={gameType}>
            <option value="subtract_square">Square subtraction game</option>
            <option value="example_card">Example card game</option>
          </select>
          {gameType == 'subtract_square' && <input type="text" name="sn" defaultValue="25" ref={numberRef} />}
          {gameType == 'example_card' && <>
                                            Use special cards?
                                            <input type="checkbox" name="usespecial" ref={useSpecialRef} />
                                         </>}
          <button type="submit">New game</button>
      </form>
}

export default CreateGameForm
