#!/usr/bin/env -S npx @arcsine/nodesh

`https://en.wikipedia.org/wiki/${$env.page || 'Special:Random'}`
  .$fetch() // Request URL
  .$toString()
  .$match(/<p[ >].*?<\/p>/ig, 'extract') // Pull out paragraphs
  .$replace(/<[^>]+>/g, '') // Drop html
  .$trim()
  .$notEmpty() // Exclude empties
  .$first() // Take 1
  .$stdout; // Return