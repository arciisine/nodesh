#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

/**
 * Scans a folder for all CamelCase words,
 * and returns the 10 most frequently used
 * values.
 */

/.ts$/
  // Find all typescript files, recursively
  .$dir({ base: $argv[0] || process.cwd() })
  // Exclude node modules
  .$filter(x => !x.includes('node_modules'))
  // Read file
  .$read()
  // Extract all CamelCase words
  .$match(/\b([A-Z][a-z]+)+\b/, 'extract')
  // Count unique
  .$sort()
  .$unique({ count: true })
  // Sort by count, descending
  .$sort((a, b) => b[1] - a[1])
  // Grab 10 most popular words
  .$first(10)
  // Display
  .$map(([word, count]) => `${word}: ${count}`)
  .$stdout;
