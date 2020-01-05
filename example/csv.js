#!/usr/bin/env -S npx @arcsine/nodesh
/* @npx-scripts */ /** @typedef {import('/tmp/npx-scripts/arcsine.nodesh')} */ // @ts-check

'Enter A Row'
  .$repeat()
  .$prompt()
  .$notEmpty()
  .$first()
  .$csv(['One', 'Two', 'Three'])
  .$tap(x => console.log(x))
  .$value;