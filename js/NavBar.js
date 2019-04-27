import React, { useRef } from 'react';
import { Link, Route, Switch } from 'react-router-dom';

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
      .then(json => props.authToken.saveToken(json.access_token))
  }

  function handleLogout(event) {
    event.preventDefault()
    props.authToken.clearToken()
  }

  const lobbyLink = (<Switch>
                        <Route exact path="/play/lobby" />
                        <Route><Link to="/play/lobby">Back to lobby</Link></Route>
                      </Switch>)
  const connStr = 'Connected to server: ' + (props.isConnected ? 'Yes': 'No')

  if (props.authToken.authInfo && props.authToken.authInfo.token) {
    return (<div className="navbar">
      This is the nav bar!
      Logged in as {props.authToken.authInfo.nickname}.
      <form onSubmit={handleLogout}>
        <button type="submit">Log out</button>
      </form>
      {connStr} {lobbyLink}
    </div>)

  }
  else {
    return (<div className="navbar">
      This is the nav bar!
      (Not currently logged in.)
      <form onSubmit={handleLogin}>
        <input type="text" name="name" ref={nameElRef} />
        <button type="submit">Log in</button>
      </form>
      {connStr} {lobbyLink}
    </div>)
  }
};

export default NavBar;
