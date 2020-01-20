#!/usr/bin/env -S npx @arcsine/nodesh

/**
 * Pulls data from remote API and stores
 * data into local Elasticsearch
 */

'https://jsonplaceholder.typicode.com/todos'
  // http get
  .$http()
  // Convert response to JSON
  .$json()
  // Remove nested array
  .$flatten()
  // Only look for uncompleted todos, and specific user
  .$filter(x => !x.completed && x.userId === 10)
  // In parallel (number of cpus - 1 is default concurrency)
  .$parallel(data =>
    'http://localhost:9200/test-api/todo'
      // Data implies POST by default, send to local elasticsearch
      .$http({ contentType: 'json', data, mode: 'raw' })
      // Get response, and convert to JSON
      .$flatMap(({ stream }) => stream.$json())
      // Return id of newly added item
      .$map(x => x._id)
  )
  .$console;
