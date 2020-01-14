#!/usr/bin/env -S npx @arcsine/nodesh@1.2.2
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

const path = require('path');

['a.txt', 'b.txt', 'c.txt']
  .$map(x => path.resolve(__dirname, '..', 'test', 'files', x))
  .$flatMap(args =>
    $exec('wc', ['-c', args])
  )
  .$columns(['count'])
  .$map(({ count }) => parseInt(count, 10))
  .$stdout;