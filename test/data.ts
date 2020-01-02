import * as assert from 'assert';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class DataSuite {

  @Test()
  async testJSON() {
    const val = await ['{"a":5}', '{"c": null}']
      .$json();

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
  async testPrompt() {
    const input = 'hello\n'.$stream();

    const result = await 'What do you say?'
      .$prompt(input)
      .$value;

    assert(result === 'hello');
  }
}