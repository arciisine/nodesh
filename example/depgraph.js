#!/usr/bin/env -S npx @arcsine/nodesh
/* @npx-scripts */ /** @typedef {import('/tmp/npx-scripts/arcsine.nodesh')} */ // @ts-check

/[.]ts$/
  .$dir({ base: $argv[0], full: true })
  .$filter(({ relative }) => !relative.includes('node_modules'))
  .$flatMap(({ file }) =>
    file
      .$read()
      .$match(/^import/)
      .$columns(['', 'src'], /\s*from\s*/)
      .$map(p => p.src)
      .$notEmpty()
      .$replace(/[';]/g, '')
      .$pair(file
        .replace(/[.]ts$/, '')
      )
  )
  .$wrap(async function* (items) {
    yield 'digraph {';
    for await (const [dep, f] of items) {
      yield `"${f}" -> "${dep}";`;
    }
    yield '}';
  })
  .$exec('dot', ['-Tpng'], 'binary')
  .$stdout;