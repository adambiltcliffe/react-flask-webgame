TO-DO LIST
==========

Create a better demo game with some hidden information

Set up a proper structure for game state and game history to include a log and replayable
game actions

Figure out a robust way to handle users logging in/out, EITHER:
 * server-side sessions with a flask route for login/logout (have to work out what to do
   about a user's sockets when they logout via an HTTP route, and the client app doesn't
   necessarily know its own login state)
   OR
 * stateless auth using JWT or whatever (have to figure out how to store the associated
   token for each socket)

Persist user and game information to a database

Make it possible to login with Google or Discord or whatever

Add functionality to create games in the lobby

Make the lobby visually less horrendous

Make the play screen visually less horrendous