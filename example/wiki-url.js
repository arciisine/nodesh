#!/usr/bin/env -S npx @arcsine/nodesh
/* @npx-scripts */ /** @typedef {import('/tmp/npx-scripts/arcsine.nodesh')} */ // @ts-check

`https://en.wikipedia.org/wiki/Special:Random`
  .$fetch() // Request URL
  .$match('URL', 'extract') // Pull out URLs
  .$map(x => new URL(x).host)
  .$sort()
  .$unique()
  .$console;
