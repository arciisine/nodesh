#!/usr/bin/npx nodesh

'.js'.async
  .dir({ full: true })
  .map(file => file.size)
  // .reduce((acc, v) => acc + v, 0)
  .console;