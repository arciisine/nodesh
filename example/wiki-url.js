#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" /> # npx-scripts

`https://en.wikipedia.org/wiki/Special:Random`
  .$fetch() // Request URL
  .$match($pattern.URL, 'extract') // Pull out URLs
  .$map(x => new URL(x).host)
  .$sort()
  .$unique()
  .$console;
