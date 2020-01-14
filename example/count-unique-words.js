#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

/.[jt]s$/
  .$dir({ base: $argv[0] || process.cwd() })
  .$filter(x => !x.includes('node_modules'))
  .$read()
  .$match($pattern.URL, 'extract')
  .$flatMap(url => url
    .$http()
    .$match($pattern.URL, 'extract')
    .$onError([])
  )
  .$notEmpty()
  .$map(x => new URL(x).host)
  .$trim()
  .$tokens(/[.\/:]+/g)
  .$sort()
  .$exec('uniq', ['-c'])
  .$stdout;
