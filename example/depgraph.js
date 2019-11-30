#!/bin/npx nodesh

/[.]ts$/.async
  .dir({ base: argv[0], full: true })
  .filter(({ relative }) => !relative.includes('node_modules'))
  .flatMap(({ file }) => file.async.read()
    .match(/^import/)
    .columns(/\s*from\s*/)
    .map(([, p]) => p)
    .notEmpty()
    .replace(/[';]/g, '')
    .pair(file
      .replace(/[.]ts$/, '')
    )
  )
  .wrap(async function* (items) {
    yield 'digraph {';
    for await (const [dep, f] of items) {
      yield `"${f}" -> "${dep}";`;
    }
    yield '}';
  })
  .exec('dot', ['-Tpng'], 'binary')
  .stdout;