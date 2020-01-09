#!/usr/bin/env -S /home/tim/.npm/lib/node_modules/@arcsine/nodesh/bin/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/home/tim/.npm/lib/node_modules/@arcsine/nodesh" /> # npx-scripts

'https://jsonplaceholder.typicode.com/todos'
  .$http()
  .$json()
  .$flatten()
  .$filter(x => !x.completed && x.userId === 10)
  .$parallel(item =>
    item.$http(
      'http://localhost:9200/test-api/todo', // Store each item
      {
        mode: 'raw',
        method: 'POST',
        data: JSON.stringify(item),
        contentType: 'application/json'
      }
    )
      .$flatMap(msg => msg.$json())
      .$map(x => x._id)
  )
  .$console;
