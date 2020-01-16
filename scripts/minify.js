#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

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