// #!/usr/bin/env -S npx @arcsine/nodesh
/// <reference path="../dist/index.d.ts" /> # npx-scripts

'.js'
  .$dir({ base: 'dist' })
  .$parallel(file => file
    .$tap(() => console.log(`Minifying ${file}`))
    .$read()
    .$exec('npx', ['babel-minify'])
    .$writeFinal(file)
    .$tap(() => console.log(`Minified ${file}`))
    .then(() => { })
  )
  .$values;