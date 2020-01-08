#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" /> # npx-scripts

'https://jsonplaceholder.typicode.com/todos'
  .$fetch('text')
  .$json()
  .$flatten()
  .$filter(x => !x.completed && x.userId === 10)
  .$parallel(item =>
    'http://localhost:9200/test-api'
      .$fetch('text', {
        method: 'POST',
      })
  )
  .$console;
