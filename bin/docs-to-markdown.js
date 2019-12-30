#!/usr/bin/npx @arcsine/nodesh

const parse = require('comment-parser');

const CODE = '```';

/**
 * 
 * @param {string[][]} acc 
 * @param {string} line 
 */
function groupDocs(acc, line) {
  if (/^\s*[/][*]/.test(line)) { // Start new group on jsdoc begin
    acc.push([]);
  }
  if (acc.length) {
    acc[acc.length - 1].push(line);
  }
  return acc;
}

/**
 * 
 * @param {string[]} lines 
 */
function extractDoc(lines) {
  const end = lines.findIndex(x => x.includes('*/')) + 1; // /Find end of comment
  const [doc] = parse(lines.slice(0, end).join('\n'), { trim: false }); // Parse
  const sig = lines.slice(end).reduce((acc, line) => {
    if (!acc[acc.length - 1].includes('): ')) {
      acc[acc.length - 1] += line;
    } else {
      acc.push(line);
    }
    return acc;
  }, ['']);
  return { doc, sig };
}

/**
 * 
 * @param {string[]} files 
 */
function processTypings(files) {
  return files
    .async
    .map(x => `dist/${x}.d.ts`)
    .map(file => file.async
      .read()
      .trim()
      .match(/(^[/][/])|(export [{])|(^\s*[}]\s*$)/, 'negate') // Remove comments and close braces
      .reduce(groupDocs, [])
      .flatten()
      .filter(x => x.length > 0)
      .map(extractDoc)
      .map(doc => ({ ...doc, file }))
    )
    .map(([header, ...docs]) => {
      // Make markdown
      const clsSig = header.sig[0];
      const clsName = clsSig.split(/class/)[1].split(/[^A-Za-z0-9_]/)[1].replace(/Operators?/, '');

      const output = ['', `### ${clsName}`, header.doc.description, ''];
      for (const { doc, sig } of docs) {
        let method = sig[0].split(/[<>(]/)[0].trim().replace(/^(g|s)et /, '');
        method = method.charAt(0).toUpperCase() + method.substring(1);

        const sigs = `${CODE}typescript\n${sig.join('\n')}\n${CODE}`;
        const examples = doc
          .tags
          .filter(x => x.tag === 'example')
          .map(x => x.source)
          .map(x => x.replace(/@example\n?/, ''))
          .map(t => `${CODE}javascript\n${t}\n${CODE}`).join('\n\n')

        output.push(`\n#### ${method}\n${sigs}\n${doc.description}\n${examples}`);
      }
      return output.join('\n');
    }).join('\n\n');
}

async function processDocs() {
  const ops = await processTypings([
    'core',
    'file',
    'transform',
    'text',
    'limit',
    'exec',
    'export'
  ].map(x => `operator/${x}`));

  const helpers = await processTypings([
    'helper'
  ]);

  await 'README.md.tpl'
    .async
    .read('text')
    .replace('%%OPERATORS%%', ops)
    .replace('%%HELPERS%%', helpers)
    .write('README.md');
}

processDocs();