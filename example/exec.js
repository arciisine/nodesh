#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

const path = require('path');

/**
 * Example of integrating exec into normal operations
 */

/[abc].txt/
  // Scan for a.txt, b.txt, c.txt file
  .$dir({ base: path.resolve(__dirname, '..', 'test', 'files'), full: true })
  .$map(f => f.file) // Get full filename
  .$flatMap(args =>
    $exec('wc', ['-c', args]) // Pass all files to wc in one command
  )
  .$columns(['count', 'file']) // Extract first output column as the count
  .$stdout; // Output