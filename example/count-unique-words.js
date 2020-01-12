#!/usr/bin/env -S npx @arcsine/nodesh

/.[jt]s$/
  .$dir({ base: $argv[0] ?? process.cwd() })
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
