#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" lib="npx-scripts" />

''
  .$exec('ps', ['aux'])
  .$columns(['user', 'pid'])
  // .$execEach('kill', ['-9'])
  .$console;