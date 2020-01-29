import * as assert from 'assert';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class DataSuite {

  @Test()
  async testJSON() {
    const val = await ['{"a":5}', '{"c": null}']
      .$json(false);

    assert(val === [{ a: 5 }, { c: null }]);
  }

  @Test()
  async testCSV() {
    const val = await [
      'a,b,c',
      'd,e,f',
      'g,h,i',
      'j',
      'k,,'
    ]
      .$csv(['1', '2', '3']);

    assert(val === [
      { 1: 'a', 2: 'b', 3: 'c' },
      { 1: 'd', 2: 'e', 3: 'f' },
      { 1: 'g', 2: 'h', 3: 'i' },
      { 1: 'j' },
      { 1: 'k', 2: '', 3: '' }
    ]);
  }


  @Test()
  async testCSVHeaderRow() {
    const val = await [
      'a,b,c',
      'd,e,f',
      'g,h,i',
      'j',
      'k,,'
    ]
      .$csv({ headerRow: true });

    assert(val.length === 4);
    assert(val[0].a === 'd');
    assert(val[3].a === 'k');
    assert(val[3].b === '');
  }

  @Test()
  async testCSVConfig() {
    const val = await [
      'a|b|c',
      'd|e|f',
      '"abc|def"|"ij""kl"|"z\"\"d"',
      '"abc'
    ]
      .$csv({ headerRow: true, sep: '|' });

    assert(val.length === 3);
    assert(val[0].a === 'd');
    assert(val[1].a === 'abc|def');
    assert(val[1].b === 'ij"kl');
    assert(val[1].c === 'z"d');
    assert(val[2].a === 'abc');
  }


  @Test()
  async testPrompt() {
    const input = 'hello\n'.$stream();

    const result = await 'What do you say?'
      .$prompt({ input })
      .$value;

    assert(result === 'hello');
  }

  @Test()
  async testGzip() {
    const result = await __filename.$replace('.js', '.ts').$read().$gzip();

    assert(result[0] instanceof Buffer);

    const [contents] = await result.$gunzip('text');

    assert(contents.includes('async testGzip()'));
  }

  @Test()
  async testGzipSimple() {
    const result = await __filename.$gzip();

    const all = Buffer.concat(result);

    assert(all instanceof Buffer);

    const [contents] = await all.$gunzip('text');

    assert(contents === __filename);
  }
}