#!/bin/npx @arcsine/nodesh

`https://en.wikipedia.org/wiki/${$env.page || 'Special:Random'}`
  .$fetch() // Request URL
  .$singleLine() // Read into single line
  .$match(/<p[ >].*?<\/p>/ig, 'extract') // Pull out paragraphs
  .$replace(/<[^>]+>/g, '') // Drop html
  .$trim()
  .$notEmpty() // Exclude empties
  .$first() // Take 1
  .$stdout; // Return