#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" /> # npx-scripts

$range(10000)
  .$sort((a, b) => Math.random() - .5)
  .$batch(2000)
  .$map(grp => grp
    .$parallel(val => [val].$wait(val))
  )
  .$tap(x => console.log(x.length))
  .$map(x => undefined)
  .$console;
