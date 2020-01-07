// #!/usr/bin/env -S npx @arcsine/nodesh
/// <reference path="../dist/index.d.ts" /> # npx-scripts

'.js'
  .$dir({ base: 'dist' })
  .$parallel(file => file
    .$read()
    .$exec('npx', ['babel-minify'])
    .$writeFinal(file)
    .then(() => console.log(`Wrote ${file}`))
  )
  .$values;