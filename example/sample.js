#!/bin/npx nodesh

const path = require('path');

/.[jt]s$/.async
  .dir(path.resolve(process.cwd(), '../tim-resume/src'))
  .read()
  .match('URL', 'extract')
  .flatMap(url => url.async
    .fetch()
    .match('URL', 'extract')
  )
  .map(x => new URL(x).host)
  .startTime('Counting', true)
  .trim()
  .tokens(/[.\/:]+/g)
  .sort()
  .exec('uniq', ['-c'])
  // .tap(console.log)
  .stopTime('Counting', true)
  .stdout;
