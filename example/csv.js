#!/usr/bin/npx @arcsine/nodesh

'Enter A Row'
  .$repeat()
  .$prompt()
  .$notEmpty()
  .$first()
  .$csv(['One', 'Two', 'Three'])
  .$tap(x => console.log(x))
  .$value;