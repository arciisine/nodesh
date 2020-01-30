// @ts-check
const parse = require('comment-parser');

/**
 * 
 * @param {string} str
 */
function trim(str) {
  str = str.trim();
  while (str.endsWith('\n')) {
    str = str.substring(0, str.length - 1);
    str = str.trim();
  }
  return str;
}

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
  const sigs = lines.slice(end).reduce((acc, line) => {
    if (!acc[acc.length - 1].includes('): ')) {
      acc[acc.length - 1] += line;
    } else {
      acc.push(line);
    }
    return acc;
  }, ['']);
  return { doc, sigs };
}

/**
 *
 * @param {string} file
 */
function processTyping(file) {
  return file
    .$read()
    .$trim()
    .$match(/(^[/][/])|(export [{])|(^\s*[}]\s*$)/, { negate: true }) // Remove comments and close braces
    .$reduce(groupDocs, [])
    .$flatten()
    .$filter(x => x.length > 0)
    .$map(extractDoc);
}

/**
 *
 * @param {{sigs:string[], doc: parse.Comment}[]} all
 */
function extractAllDocs(all) {
  const [header, ...docs] = all;
  // Make markdown
  const clsSig = header.sigs[0];
  const clsName = clsSig.split(/class/)[1].split(/[^A-Za-z0-9_]/)[1].replace(/Operators?/, '');

  const sections = [];
  for (const { doc, sigs } of docs) {
    let method = trim(sigs[0]
      .split(/[<>(]/)[0]
      .trim()
      .replace(/\bstatic\b/, '')
      .replace(/^\s*(g|s)et\s+/, ''));


    method = method.charAt(0).toUpperCase() + method.substring(1);

    const examples = doc
      .tags
      .filter(x => x.tag === 'example')
      .map(x => x.source)
      .map(x => x
        .replace(/@example\n?/, '')
        .replace(/\/\/\s*(@.*)/g, (a, c) => `/** ${c} */`)
      )
      .map(trim);

    sections.push({
      sigs: sigs.map(trim),
      method,
      doc,
      examples
    });
  }

  return {
    clsName,
    description: header.doc.description,
    sections
  };
}

module.exports = {
  parse,
  groupDocs,
  processTyping,
  extractDoc,
  extractAllDocs
};