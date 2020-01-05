#!/usr/bin/env -S npx @arcsine/nodesh
/* @npx-scripts */ /** @typedef {import('/tmp/npx-scripts/arcsine.nodesh')} */ // @ts-check

'.js'
  .$dir({ base: 'dist' })
  .$parallel(file => file
    .$read()
    .$exec('npx', ['babel-minify'])
    .$writeFinal(file)
    .then(() => console.log(`Wrote ${file}`))
  )
  .$values;