#!/bin/npx @arcsine/nodesh

`https://en.wikipedia.org/wiki/Special:Random`
  .async
  .fetch() // Request URL
  .match('URL', 'extract') // Pull out URLs
  .map(x => new URL(x).host)
  .sort()
  .unique()
  .console;
