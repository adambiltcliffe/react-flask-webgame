import React, { useRef } from 'react'
import { useHandler } from './handler'

function CreateGameForm(props) {
  const gameTypeRef = useRef(null)
  const handler = useHandler()

  function handleCreateGame(event) {
    event.preventDefault()
    handler.createGame(gameTypeRef.current.value)
  }

  return <form onSubmit={handleCreateGame}>
          <select name="type" ref={gameTypeRef}>
            <option value="subtract_square">Square subtraction game</option>
            <option value="example_card">Example card game</option>
          </select>
          <button type="submit">New game</button>
      </form>
}

export default CreateGameForm
