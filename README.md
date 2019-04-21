TO-DO LIST
==========

Added functionality
-------------------

Add functionality to create games in the lobby

Refactoring, bugfixing etc.
---------------------------

Make a RendererSelector component with lazy loading

Find a way to avoid needing to include gameid in the reducer actions for set_shown_step etc.

Avoid destroying/recreating the socket when logging in/out

Handle token expirations in some sensible way?

Find some way of avoiding trouble with race conditions when connecting/disconnecting?

Allow server to provide better prompt text

Make sure prompts etc. are disabled if the connection has gone away


Won't add in this (generic) version
-----------------------------------

Persist user and game information to a database

Make it possible to login with Google or Discord or whatever
