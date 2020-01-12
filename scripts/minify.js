#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" lib="npx-scripts" />

'.js'
  .$dir({ base: 'dist' })
  .$parallel(file => file
    .$tap(() => console.log(`Minifying ${file}`))
    .$read()
    .$exec('npx', ['babel-minify'])
    .$writeFinal(file)
    .then(() => console.log(`Minified ${file}`))
  )
  .$values;