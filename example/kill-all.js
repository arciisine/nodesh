#!/usr/bin/env -S npx @arcsine/nodesh
/* @npx-scripts */ /** @typedef {import('/tmp/npx-scripts/arcsine.nodesh')} */ // @ts-check

'aux'
  .$execEach('ps')
  .$match(/node.*travetto/)
  .$tap(console.log)
  .$columns(['user', 'pid'])
  .$map(({ pid }) => pid)
  // .$execEach('kill', ['-9'])
  .$console;