#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" /> # npx-scripts

'.js'
  .$dir({ full: true })
  .$map(file => file.stats.size)
  // .reduce((acc, v) => acc + v, 0)
  .$console;