#!/usr/bin/env -S npx @arcsine/nodesh
/* @npx-scripts */ /** @typedef {import('/tmp/npx-scripts/arcsine.nodesh')} */ // @ts-check

'https://jsonplaceholder.typicode.com/todos'
  .$fetch('text')
  .$json()
  .$flatten()
  .$filter(x => !x.completed && x.userId === 10)
  .$parallel(item =>
    'http://localhost:9200/test-api'
      .$fetch('line', {
        method: 'POST',
      })
  )
  .$console;
