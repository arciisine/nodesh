#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

/** @template T */
class AsyncIterable {
  /** @returns {AsyncIterable<T>} */
  $reverse() {
    return this
      .$collect() // Gather the entire sequence as an array
      .$flatMap(x => x.reverse()); // Reverse it and flatten
  }
}

$registerOperator(AsyncIterable);

$stdin
  .$reverse()
  .$stdout;