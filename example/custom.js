#!/usr/bin/npx @arcsine/nodesh

/**
 *
 * @param {AsyncGenerator<string>} stream
 */
function reverse(stream) {
  return stream
    .collect() // Gather the entire sequence as an array
    .map(x => x.reverse()) // Reverse it
    .flatten()
    .map(x => x.split('').reverse().join('')); // Flatten it back into a single sequence
}

stdin
  .wrap(reverse)
  .stdout;