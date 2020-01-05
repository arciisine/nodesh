#!/usr/bin/env -S npx @arcsine/nodesh
/* @npx-scripts */ /** @typedef {import('/tmp/npx-scripts/arcsine.nodesh')} */ // @ts-check

'.js'
  .$dir({ full: true })
  .$map(file => file.stats.size)
  // .reduce((acc, v) => acc + v, 0)
  .$console;