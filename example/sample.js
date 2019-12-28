#!/bin/npx nodesh

const path = require('path');

/.[jt]s$/.async
  .dir({ base: path.resolve(process.cwd(), '../tim-resume/src') })
  .read()
  .match('URL', 'extract')
  .flatMap(url => url.async
    .fetch()
    .match('URL', 'extract')
  )
  .map(x => new URL(x).host)
  .tap(console.log)
  .startTime('Counting', true)
  .trim()
  .tokens(/[.\/:]+/g)
  .sort()
  .tap(console.log)
  .exec('uniq', ['-c'])
  .tap(console.log)
  .stopTime('Counting', true)
  .console;
