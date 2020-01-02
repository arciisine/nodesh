#!/bin/npx @arcsine/nodesh

$range(10000)
  .$sort((a, b) => Math.random() - .5)
  .$batch(2000)
  .$map(grp => grp
    .$parallel(val => [val].$wait(val))
  )
  .$tap(x => console.log(x.length))
  .$map(x => undefined)
  .$console;
