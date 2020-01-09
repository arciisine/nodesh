#!/usr/bin/env -S /home/tim/.npm/lib/node_modules/@arcsine/nodesh/bin/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/home/tim/.npm/lib/node_modules/@arcsine/nodesh" /> # npx-scripts

'https://jsonplaceholder.typicode.com/todos'
  .$http()
  .$json()
  .$flatten()
  .$filter(x => !x.completed && x.userId === 10)
  .$parallel(data =>
    'http://localhost:9200/test-api/todo'
      .$http({ contentType: 'json', data, mode: 'raw' })
      .$flatMap(msg => msg.$json())
      .$map(x => x._id)
  )
  .$console;
