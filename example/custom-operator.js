#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

/**
 * Registers a custom operator, with JSDoc support, to support
 * typings.
 */

/** @template T */
class AsyncIterable {
  /** @returns {AsyncIterable<T>} */
  $reverse() {
    return this
      .$collect() // Gather the entire sequence as an array
      .$flatMap(x => x.reverse()); // Reverse it and flatten
  }
}

// Register
$registerOperator(AsyncIterable);

$stdin // Read stdin until EOF
  .$reverse() // Reverse all contents
  .$stdout; // Return contents to stdout