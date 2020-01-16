#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

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
  const end = lines.findIndex(x => /^\s*[*][/]/.test(x)) + 1; // /Find end of comment
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
 * @param {{sig:string[], doc: parse.Comment}[]} all
 */
function extractAllDocs(all) {
  const [header, ...docs] = all;
  // Make markdown
  const clsSig = header.sig[0];
  const clsName = clsSig.split(/class/)[1].split(/[^A-Za-z0-9_]/)[1].replace(/Operators?/, '');

  const output = ['', `### ${clsName}`, header.doc.description, ''];
  for (const { doc, sig } of docs) {
    let method = sig[0]
      .split(/[<>(]/)[0]
      .trim()
      .replace(/\bstatic\b/, '')
      .replace(/^\s*(g|s)et\s+/, '');

    method = method.charAt(0).toUpperCase() + method.substring(1);

    const sigs = `${CODE}typescript\n${sig.join('\n')}\n${CODE}`;
    const examples = doc
      .tags
      .filter(x => x.tag === 'example')
      .map(x => x.source)
      .map(x => x
        .replace(/@example\n?/, '')
        .replace(/\/\/\s*(@.*)/g, (a, c) => `/** ${c} */`)
      )
      .map(t => `${CODE}javascript\n${t}\n${CODE}`).join('\n\n');

    output.push(`\n#### ${method}\n${doc.description}\n${sigs}\nExample\n${examples}`);
  }
  return output.join('\n');
}

/**
 *
 * @param {string} file
 */
function processTyping(file) {
  return `dist/${file}.d.ts`
    .$read()
    .$trim()
    .$match(/(^[/][/])|(export [{])|(^\s*[}]\s*$)/, 'negate') // Remove comments and close braces
    .$reduce(groupDocs, [])
    .$flatten()
    .$filter(x => x.length > 0)
    .$map(extractDoc);
}

async function processDocs() {
  const items = [
    'operator/core',
    'operator/file',
    'operator/transform',
    'operator/text',
    'operator/limit',
    'operator/exec',
    'operator/export',
    'operator/advanced'
  ];

  const [OPERATORS] = await items
    .$map(processTyping)
    .$map(extractAllDocs)
    .$join('\n\n')
    .$toString();

  const [OPERATORS_TOC] = await OPERATORS
    .split('\n')
    .$match(/^### /)
    .$replace(/^###\s(.*?)\s*$/, (a, name) => name)
    .$map(name => `* [${name}](#${name.toLowerCase().replace(/ /g, '-')})`)
    .$join('\n')
    .$toString();

  const [HELPERS] = await 'helper'
    .$map(processTyping)
    .$map(extractAllDocs);

  /** @type {Record<string, string>} */
  const context = {
    OPERATORS_TOC,
    OPERATORS,
    HELPERS
  };

  await 'README.tpl.md'
    .$read()
    .$replace(/%%([^%]+)?%%/g, (all, token) => context[token])
    .$write('README.md');
}

processDocs();
