#!/usr/bin/env -S npx @arcsine/nodesh

/**
 * Pulls data from remote API and stores
 * data into local Elasticsearch
 */

'https://jsonplaceholder.typicode.com/todos'
  .$http()
  .$json()
  .$flatten()
  .$filter(x => !x.completed && x.userId === 10)
  .$parallel(data =>
    'http://localhost:9200/test-api/todo'
      .$http({ contentType: 'json', data, mode: 'raw' })
      .$flatMap(({ stream }) => stream.$json())
      .$map(x => x._id)
  )
  .$console;
