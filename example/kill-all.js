#!/bin/npx @arcsine/nodesh

'aux'
  .$execEach('ps')
  .$match(/node.*travetto/)
  .$tap(console.log)
  .$columns(['user', 'pid'])
  .$map(({ pid }) => pid)
  // .$execEach('kill', ['-9'])
  .$console;