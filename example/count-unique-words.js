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
    .$match(/\b[A-Z][a-z]+\b/, 'extract')
    .$onError([])
  )
  .$sort()
  .$unique({ count: true })
  .$sort((a, b) => b[1] - a[1])
  .$first(10)
  .$stdout;
