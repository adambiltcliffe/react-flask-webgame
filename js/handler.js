import { createContext, useContext } from 'react'

export const handlerContext = createContext()

export const useHandler = (() => useContext(handlerContext))
