TO-DO LIST
==========

Added functionality
-------------------

Set up replayable game actions on client

Make a RendererSelector component with lazy loading

Persist user and game information to a database

Make it possible to login with Google or Discord or whatever

Add functionality to create games in the lobby

Make the lobby visually less horrendous


Refactoring, bugfixing etc.
----------------

Move CardGameTextBox back into CardGameRenderer (and decompose?)

Remove the ability to restart games once no longer needed for testing

Set up EditorConfig

Move all the socket stuff into one place rather than duplicated in LobbyClient/GameClient
Show connection status
Handle the brief opening and closing of anonymous sockets while loading?
Handle token expirations in some sensible way?