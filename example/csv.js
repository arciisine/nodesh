#!/usr/bin/npx nodesh

ask('Enter A Row')
  .first()
  .csv(['One', 'Two', 'Three'])
  .tap(x => console.log(x))
  .values;