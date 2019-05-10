Most things are working


MongoDB stuff
-------------

Change config.players from a StringField of player IDs to an actual list of refs

Make sure model._cached_actions is persisted to at least some extent

Remove use of external gameid

Remove nickname mapping from config

Experiment with building state slices, views, etc. as Documents rather than dicts


Random stuff
------------

Clear alerts on route change


Future development
------------------

Add another, more interesting game

Persist user and game information to a database

Make it possible to login with Google or Discord or whatever

Write tests