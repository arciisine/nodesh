#!/usr/bin/npx @arcsine/nodesh

'.js'
  .$dir({ base: 'dist' })
  .$parallel(file => file
    .$read('text')
    .$exec('npx', ['babel-minify'])
    .$writeFinal(file)
  )
  .$value;