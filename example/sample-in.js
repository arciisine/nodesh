#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" /> # npx-scripts

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

$stdin
  .$match($pattern.URL, 'extract')
  .$fetch()
  .$tokens(/[^A-Za-z0-9_]+/)
  .$trim()
  .$filter(x => x.length > 5 && x.charAt(0) === x.charAt(0).toUpperCase())
  .$reduce(count)
  .$flatMap(x => x.entries())
  .$sort((a, b) => a[1] - b[1])
  .$last(10)
  .$map(([k, c]) => `${k}: ${c}`)
  .$stdout;

