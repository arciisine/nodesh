#!/usr/bin/env -S npx @arcsine/nodesh
/// @ts-check # npx-scripts - found
/// <reference types="/tmp/npx-scripts/arcsine.nodesh" /> # npx-scripts

/**
 * @param {AsyncIterable<string>} stream
 */
function $reverse(stream) {
  return stream
    .$map(x => x.split('').reverse().join('')) // Reverse each line
    .$collect() // Gather the entire sequence as an array
    .$flatMap(x => x.reverse()); // Reverse it and flatten
}

$stdin
  .$wrap($reverse)
  .$stdout;