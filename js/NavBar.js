import React, { useEffect, useRef } from 'react';
import JWT from 'jwt-client';

JWT.defaults.tokenPrefix = ""

function NavBar(props) {
  const nameElRef = useRef(null)

  function handleLogin(event) {
    event.preventDefault()
    fetch('/testlogin',
      { method: 'POST',
        cache:'no-cache',
        headers: {'Content-Type': 'application/json'},
        body:JSON.stringify({name: nameElRef.current.value})
      })
      .then(response => response.json())
      .then(json => {
        const jwtValue = JWT.read(json.access_token)
        if (JWT.validate(jwtValue))
        {
          JWT.keep(jwtValue)
          props.setAuthToken(JWT.write(jwtValue))
          props.setAuthNickname(jwtValue.claim.user_claims.nickname)
        }
        else {
          JWT.forget()
        }
      })
  }

  function handleLogout(event) {
    event.preventDefault()
    JWT.forget()
    props.setAuthToken(null)
    props.setAuthNickname(null)
  }

  useEffect(() => {
    const jwtValue = JWT.remember()
    if (JWT.validate(jwtValue))
    {
      props.setAuthToken(JWT.write(jwtValue))
      props.setAuthNickname(jwtValue.claim.user_claims.nickname)
    }
    else {
      JWT.forget()
    }
  }, [props.authNickname])

  if (props.authNickname) {
    return (<div>
      This is the nav bar!
      Logged in as {props.authNickname}.
      <form onSubmit={handleLogout}>
        <button type="submit">Log out</button>
      </form>
    </div>)

  }
  else {
    return (<div>
      This is the nav bar!
      (Not currently logged in.)
      <form onSubmit={handleLogin}>
        <input type="text" name="name" ref={nameElRef} />
        <button type="submit">Log in</button>
      </form>
    </div>)
  }
};

export default NavBar;
