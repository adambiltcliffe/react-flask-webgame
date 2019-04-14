TO-DO LIST
==========

Move CardGameTextBox back into CardGameRenderer (and decompose?)

Cache legal actions to avoid recomputing for validation

Remove the ability to restart games once no longer needed for testing

Set up replayable game actions on client

Make a RendererSelector component with lazy loading

Persist user and game information to a database

Make it possible to login with Google or Discord or whatever

Add functionality to create games in the lobby

Make the lobby visually less horrendous

Set up EditorConfig

Move all the socket stuff into one place rather than duplicated in LobbyClient/GameClient
Show connection status
Handle the brief opening and closing of anonymous sockets while loading?
Handle token expirations in some sensible way?