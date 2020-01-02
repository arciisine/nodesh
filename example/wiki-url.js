#!/bin/npx @arcsine/nodesh

`https://en.wikipedia.org/wiki/Special:Random`.$
  .fetch() // Request URL
  .match('URL', 'extract') // Pull out URLs
  .map(x => new URL(x).host)
  .sort()
  .unique()
  .console;
