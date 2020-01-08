#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" /> # npx-scripts

'Enter A Row'
  .$repeat()
  .$prompt()
  .$notEmpty()
  .$first()
  .$csv(['One', 'Two', 'Three'])
  .$tap(x => console.log(x))
  .$value;