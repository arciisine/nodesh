#!/usr/bin/env -S npx .

/**
 * Returns the first (non-empty) paragraph from a random wikipedia page
 *
 * @example
 * ./examples/wiki-random.para.js | say
 */

`https://en.wikipedia.org/wiki/${$env.page || 'Special:Random'}`
  .$http() // Request URL
  .$toString() // To single line
  .$tokens(/<p[ >].*?<\/p>/smg) // Pull out paragraphs
  .$replace(/<[^>]+>/g, '') // Drop html
  // Replace html entities
  .$replace(/&#(\d+);/g, (a, c) => String.fromCodePoint(c))
  .$replace(/&#x([0-9a-f]+);/g, (a, c) => String.fromCodePoint(parseInt(c, 16)))
  .$trim() // Clean
  .$notEmpty() // Exclude empties
  .$first() // Return first
  .$stdout;