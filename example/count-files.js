#!/usr/bin/env -S npx @arcsine/nodesh

/**
 * Recursively counts total file size of all .js files in the current directory
 */

'.js'
  // List (recursively) all files in current directory, with '.js' extension
  .$dir({ full: true })
  // Extract full object, giving us access to the stats file
  .$map(file => file.stats.size)
  // Combine the file size of every file
  .$reduce((acc, v) => acc + v, 0)
  // Sum to produce total size of all files
  .$console;