#!/usr/bin/env -S npx .

/**
 * @param {Map<string, number>} acc
 * @param {string} item
 */
function count(acc, item) {
  acc = acc || new Map();
  acc.set(item, (acc.get(item) || 0) + 1);
  return acc;
}
count.init = () => new Map();

/**
 * Reads urls from stdin, and extracts proper names, with counts
 * from the resultant http output
 */
$stdin
  // Extract URLs from stdin
  .$tokens($pattern.URL)
  .$tap(console.log.bind(console.log))
  // Request each URL
  .$http()
  // Extract proper name tokens from resultant web responses
  .$tokens(/\b[A-Z][a-z]{5,100}\b/)
  // Count them all
  .$reduce(count)
  // Convert to [key, value] array
  .$flatMap(x => x.entries())
  // Sort by count, ascending
  .$sort((a, b) => a[1] - b[1])
  // Take last 10
  .$last(10)
  // Output
  .$map(([k, c]) => `${k}: ${c}`)
  .$stdout;

