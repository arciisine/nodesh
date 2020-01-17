#!/usr/bin/env -S npx .

`https://en.wikipedia.org/wiki/${$env.page || 'Special:Random'}`
  .$http() // Request URL
  .$toString()
  .$match(/<p[ >].*?<\/p>/smg, 'extract') // Pull out paragraphs
  .$replace(/<[^>]+>/g, '') // Drop html
  .$trim()
  .$notEmpty() // Exclude empties
  .$first() // Take 1
  .$stdout; // Return