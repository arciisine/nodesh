#!/usr/bin/npx @arcsine/nodesh

'.js'.async
  .dir({ full: true })
  .map(file => file.stats.size)
  // .reduce((acc, v) => acc + v, 0)
  .console;