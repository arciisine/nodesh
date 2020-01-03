#!/usr/bin/npx @arcsine/nodesh

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
