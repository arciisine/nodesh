#!/usr/bin/npx @arcsine/nodesh

'Enter A Row'.async.prompt()
  .first()
  .csv(['One', 'Two', 'Three'])
  .tap(x => console.log(x))
  .values;