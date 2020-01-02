#!/usr/bin/npx @arcsine/nodesh

'.js'
  .$dir({ base: 'dist' })
  .$forEach(file => file
    .$read('text')
    .$replace(/\n/g, '')
    .$replace(/[ ]+/g, ' ')
    .$writeFinal(file)
  );