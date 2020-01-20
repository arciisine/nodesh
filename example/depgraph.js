#!/usr/bin/env -S npx @arcsine/nodesh

/**
 * Produces a dependency graph of imports within
 * .ts files in the CWD
 */

/[.]ts$/
  // Scan all .ts files, recursively
  // Return full objects, with stats and file name
  .$dir({ base: $argv[0] ?? process.cwd(), full: true })

  // Exclude all node_module files
  .$filter(({ relative }) => !relative.includes('node_modules'))

  // Process each file
  .$flatMap(({ file }) => file
    .$read() // Get file contents
    .$match(/^import/) // Match on import statements
    .$columns(['decl', 'src'], /\s*from\s*/) // Convert to object, split on from
    .$map(p => p.src) // Only care about the source
    .$notEmpty() // Drop empties
    .$replace(/[';]/g, '') // Cleanup from sloppy split
    .$pair(file.replace(/[.]ts$/, '')) // Combine each imports with filename
  )
  .$wrap(async function* (items) { // With all items
    yield 'digraph {'; // Start of dot file output
    for await (const [dep, f] of items) {
      yield `"${f}" -> "${dep}";`; // Output each import as an edge
    }
    yield '}'; // Close
  })
  // Pipe stream into 'dot', and produce png output
  .$exec('dot', { args: ['-Tpng'], mode: 'binary' })
  .$stdout; // Send out;