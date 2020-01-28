#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" lib="npx-scripts" />

__filename
  .$read()
  .$exec('gzip', { mode: 'binary' })
  .$exec('gunzip', ['-c'])
  .$stdout;
