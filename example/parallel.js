#!/usr/bin/env -S npx @arcsine/nodesh

/**
 * Example of parallel operation
 */
$range(5000)
  .$sort((a, b) => Math.random() - .5) // shuffle
  .$batch(1000) // Set up as batches of 1000
  .$map(grp => grp
    // Parallelize each batch, waiting x milliseconds
    //  Run all at once
    .$parallel(val => [val].$wait(val), grp.length)
  )
  .$map(x => x.length) // Count the length
  .$console;
