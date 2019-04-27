import { useCallback, useEffect, useMemo, useState } from 'react'
import JWT from 'jwt-client'

JWT.defaults.tokenPrefix = ""

export const useAuthToken = () => {
  const [authInfo, setAuthInfo] = useState()

  const validateAndSave = (jwtValue) => {
    if (JWT.validate(jwtValue))
    {
      JWT.keep(jwtValue)
      setAuthInfo({token: JWT.write(jwtValue),
        userid: jwtValue.claim.identity,
        nickname: jwtValue.claim.user_claims.nickname})
    }
    else {
      JWT.forget()
      clearToken()
    }
  }

  const saveToken = useCallback((rawToken) => {
    validateAndSave(JWT.read(rawToken))
  })

  const clearToken = useCallback(() => {
    JWT.forget()
    setAuthInfo({token: null,
      userid: null,
      nickname: null})
  })

  useEffect(() => {
    validateAndSave(JWT.remember())
  }, []) // only runs when component created

  return useMemo(() => ({
    authInfo,
    saveToken,
    clearToken
  }), [authInfo])
}
