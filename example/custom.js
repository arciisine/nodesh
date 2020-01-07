#!/usr/bin/env -S npx @arcsine/nodesh

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