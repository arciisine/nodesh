#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" /> # npx-scripts

const path = require('path');

/.[jt]s$/
  .$dir({ base: path.resolve(process.cwd(), '../tim-resume/src') })
  .$read()
  .$match($pattern.URL, 'extract')
  .$flatMap(url => url
    .$fetch()
    .$match($pattern.URL, 'extract')
  )
  .$map(x => new URL(x).host)
  .$tap(console.log)
  .$startTime('Counting', true)
  .$trim()
  .$tokens(/[.\/:]+/g)
  .$sort()
  .$tap(console.log)
  .$exec('uniq', ['-c'])
  .$tap(console.log)
  .$stopTime('Counting', true)
  .$console;
