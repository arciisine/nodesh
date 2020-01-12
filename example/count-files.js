#!/usr/bin/env -S npx @arcsine/nodesh

'.js'
  .$dir({ full: true })
  .$map(file => file.stats.size)
  .reduce((acc, v) => acc + v, 0)
  .$console;