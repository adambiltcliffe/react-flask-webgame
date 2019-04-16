TO-DO LIST
==========

Added functionality
-------------------

Add functionality to create games in the lobby

Make the lobby visually less horrendous


Refactoring, bugfixing etc.
---------------------------

Make the history autoscroll down intelligently

Make a RendererSelector component with lazy loading

Move CardGameTextBox back into CardGameRenderer (and decompose?)

Remove the ability to restart games once no longer needed for testing

Move all the socket stuff into one place rather than duplicated in LobbyClient/GameClient
Show connection status
Handle the brief opening and closing of anonymous sockets while loading?
Handle token expirations in some sensible way?


Won't add in this (generic) version
-----------------------------------

Persist user and game information to a database

Make it possible to login with Google or Discord or whatever
