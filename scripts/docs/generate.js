#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types="../.." lib="npx-scripts" />

const { processTyping, extractAllDocs } = require('./util');

const items = () => [
  'operator/core',
  'operator/file',
  'operator/transform',
  'operator/text',
  'operator/limit',
  'operator/exec',
  'operator/export',
  'operator/advanced'
]
  .$map(x => `dist/${x}.d.ts`)
  .$map(processTyping)
  .$map(extractAllDocs);

const helper = () => 'helper'
  .$map(x => `dist/${x}.d.ts`)
  .$map(processTyping)
  .$map(extractAllDocs);

async function genMarkdown() {
  const CODE = '```';

  function extractAllDocsAsMarkdown(all) {
    const { clsName, sections, description } = all;

    const output = [
      '',
      `### ${clsName}`,
      description,
      '',
      ...sections.flatMap(({ doc, method, sigs, examples }) =>
        [
          '',
          `#### ${method}`,
          doc.description,
          `${CODE}typescript\n${sigs.join('\n')}\n${CODE}`,
          'Example',
          ...examples.map((t, i) => `${i > 0 ? '\n' : ''}${CODE}javascript\n${t}\n${CODE}`)
        ]
      ),
    ];
    return output.join('\n');
  }

  const computed = await items();

  const [OPERATORS] = await computed
    .$map(extractAllDocsAsMarkdown)
    .$join('\n\n')
    .$toString();

  const [OPERATORS_TOC] = await computed
    .$map(item => `* [${item.clsName}](#${item.clsName.toLowerCase().replace(/ /g, '-')})`)
    .$join('\n')
    .$toString();

  const [HELPERS] = await helper()
    .$map(extractAllDocsAsMarkdown);

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

const TOKENS = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>'
};

async function genHTML() {

  const hljs = require('highlightjs');
  const ts = hljs.getLanguage('typescript');
  ts.keywords.built_in += ` fs`;
  const js = hljs.getLanguage('javascript');
  js.keywords.built_in += ` fs`;

  const [html] = await 'README.md'
    .$read()
    .$skip(7)
    .$replace(/^(##+)\s+(.+)/, (all, h, text) =>
      `<h${h.length} id="${text.toLowerCase().replace(/[^a-z$]+/g, '-')}">${text}</h${h.length}>\n \n`
    )
    .$exec('npx', ['markdown-it', '-l'])
    .$replace(TOKENS)
    .$join('\n')
    .$toString();

  const [HELPER_TOC] = await helper()
    .$flatMap(x => x.sections)
    .$map(x => x.method)
    .$trim()
    .$unique()
    .$map(x => `<li><a href="#${x.toLowerCase().replace(/[^a-z$]+/g, '-')}">${x}</a></li>`)
    .$join('\n')
    .$toString();

  const [OPERATOR_TOC] = await items()
    .$map(x => `
      <li><a href="#${x.clsName.toLowerCase()}">${x.clsName}</a>
      <ul>
        ${x.sections.map(s => s.method).reduce((acc, v) => {
      if (!acc.includes(v)) {
        acc.push(v);
      }
      return acc;
    }, [])
        .map(s => `<li><a href="#${s.toLowerCase()}">${s}</a></li>`).join('\n')
      }
      </ul>
    `)
    .$join('\n')
    .$toString();

  await 'docs/index.tpl.html'
    .$read()
    .$replace(/<!-- CONTENT -->/, html)
    .$replace(/<!-- HELPER_TOC -->/, HELPER_TOC)
    .$replace(/<!-- OPERATOR_TOC -->/, OPERATOR_TOC)
    .$toString()
    .$replace(/<pre>\s*<code class="language-(\S+)">(.*?)<\/code>\s*<\/pre>/sm,
      (all, lang, text) =>
        `<pre>
          <code class="hljs language-${lang}">${hljs.highlight(lang, text).value}</code>
        </pre>`
    )
    .$replace(/(?<!["#])[$][a-z]+([A-Za-z]+)?/g, token =>
      `<span class="operator">${token}</span>`
    )
    .$replace(/\b([A-Z][a-z]+){1,5}\b/g, token => /Nodesh|The|Node|Shell/.test(token) ? token :
      `<span class="proper-name">${token}</span>`
    )
    .$write('docs/index.html');
}

genMarkdown().then(genHTML);