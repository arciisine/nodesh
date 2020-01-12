#!/usr/bin/env -S npx @arcsine/nodesh

/**
 * Example of parallel operation
 */
$range(5000)
  .$sort((a, b) => Math.random() - .5)
  .$batch(1000)
  .$map(grp => grp
    .$parallel(val => [val].$wait(val), grp.length)
  )
  .$tap(x => console.log(x.length))
  .$map(x => undefined)
  .$console;
