#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

/**
 * Example of concatenating two streams
 */
$range(1, 10)
  .$concat( // Combine three streams into 1
    $range(11, 20),
    $range(21, 30)
  )
  .$collect()
  .$map(all => all.length) // Length should be 30 (sum of all 3)
  .$stdout;
