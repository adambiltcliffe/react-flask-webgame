import { useCallback, useEffect, useMemo, useState } from 'react'
import JWT from 'jwt-client'

JWT.defaults.tokenPrefix = ""

export const useAuthToken = () => {
  const [authInfo, setAuthInfo] = useState()

  const validateAndSave = (rawToken) => {
    if (rawToken && JWT.validate(rawToken))
    {
      JWT.keep(rawToken)
      const jwtValue = JWT.read(rawToken)
      setAuthInfo({token: rawToken,
        userid: jwtValue.claim.identity,
        nickname: jwtValue.claim.user_claims.nickname})
    }
    else {
      clearToken()
    }
  }

  const saveToken = useCallback((rawToken) => {
    validateAndSave(rawToken)
  })

  const clearToken = useCallback(() => {
    JWT.forget()
    setAuthInfo(auth => {
      if (auth && !auth.token) {
        return auth
      }
      return {
        token: null,
        userid: null,
        nickname: null
      }})
  })

  const getTokenIfValid = useCallback(() => {
    const rawToken = JWT.get()
    if (JWT.validate(rawToken)) {
      return rawToken
    }
    else {
      clearToken()
      return null
    }
  }, [])

  useEffect(() => {
    validateAndSave(JWT.get())
  }, []) // only runs when component created

  return useMemo(() => ({
    authInfo,
    saveToken,
    clearToken,
    getTokenIfValid
  }), [authInfo])
}
