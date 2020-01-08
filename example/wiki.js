#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" /> # npx-scripts

`https://en.wikipedia.org/wiki/${$env.page || 'Special:Random'}`
  .$fetch() // Request URL
  .$match(/<p[ >].*?<\/p>/ig, 'extract') // Pull out paragraphs
  .$replace(/<[^>]+>/g, '') // Drop html
  .$trim()
  .$notEmpty() // Exclude empties
  .$first() // Take 1
  .$stdout; // Return