#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" /> # npx-scripts

'aux'
  .$execEach('ps')
  .$match(/node.*travetto/)
  .$tap(console.log)
  .$columns(['user', 'pid'])
  .$map(({ pid }) => pid)
  // .$execEach('kill', ['-9'])
  .$console;