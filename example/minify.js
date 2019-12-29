#!/usr/bin/npx @arcsine/nodesh

'.js'.async
  .dir({ base: 'dist' })
  .forEach(file => file.async
    .read('text')
    .replace(/\n/g, '')
    .replace(/[ ]+/g, ' ')
    .writeFinal(file)
  );