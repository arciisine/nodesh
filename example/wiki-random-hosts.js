#!/usr/bin/env -S npx .

/**
 * Finds all URLs on a random wikipedia page,
 * and counts the unique domains
 */

`https://en.wikipedia.org/wiki/Special:Random`
  .$http() // Request URL
  .$match($pattern.URL, 'extract') // Pull out URLs
  .$map(x => new URL(x).host) // Extract host
  .$match('wiki', 'negate') // Exclude all hosts with 'wiki'
  .$sort()
  .$unique({ count: true }) // Count by unique
  .$sort((a, b) => b[1] - a[1]) // Sort by count desc
  .$console;
