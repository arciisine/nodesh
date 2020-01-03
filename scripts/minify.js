#!/usr/bin/npx @arcsine/nodesh

'.js'
  .$dir({ base: 'dist' })
  .$parallel(file => file
    .$read()
    .$exec('npx', ['babel-minify'])
    .$writeFinal(file)
    .$tap(() => console.log(`Wrote ${file}`))
  )
  .$values;