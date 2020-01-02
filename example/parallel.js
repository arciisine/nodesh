#!/bin/npx @arcsine/nodesh

range(10)
  .sort((a, b) => Math.random() - .5)
  .collect()
  .tap(console.log)
  .flatten()
  .parallel(val => (val).$.wait(val ** 3.5))
  .console;
