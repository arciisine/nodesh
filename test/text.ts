import * as assert from 'assert';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class TextSuite {

  @Test()
  async testColumns() {
    const data = `a b c\nd e f\ng h\nj    k l m`.split(/\n/);

    const res = await data
      .$columns();

    assert(res === [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h'], ['j', 'k', 'l', 'm']]);

    const res2 = await data
      .$columns(['1', '2', '3']);

    assert(res2 === [
      { 1: 'a', 2: 'b', 3: 'c' },
      { 1: 'd', 2: 'e', 3: 'f' },
      { 1: 'g', 2: 'h' },
      { 1: 'j', 2: 'k', 3: 'l' }
    ]);
  }

  @Test()
  async testTokens() {
    const res = await 'test/files/book.txt'
      .$read()
      .$tokens()
      .$notEmpty();

    assert(res.length === 12);

    const res2 = await 'test/files/book.txt'
      .$read()
      .$tokens(/[ 0-9]+/) // Exclude numbers
      .$notEmpty();

    assert(res2.length === 6);

    const res3 = await 'test/files/book.txt'
      .$read()
      .$tokens(/Chapter \d+/) // Exclude numbers
      .$notEmpty()
      .$sort()
      .$unique();

    assert(res3.length === 2);
  }

  @Test()
  async testMatch() {
    const res = await 'test/files/book.txt'
      .$read()
      .$match(/Chapter/);

    assert(res === ['Chapter 1', 'Chapter 2']);

    const res3 = await 'test/files/book.txt'
      .$read()
      .$match(/Chapter/, { negate: true })
      .$notEmpty();

    assert(res3.length === 4);
  }

  @Test()
  async testMatchContext() {
    const res = await 'test/files/book.txt'
      .$read()
      .$match(/Chapter 2/, { after: 1, before: 1 });

    assert(res === ['', 'Chapter 2', 'Line 3']);

    const res2 = await 'test/files/book.txt'
      .$read()
      .$match(/Chapter 2/, { after: 100 });

    assert(res2 === ['Chapter 2', 'Line 3', 'Line 4']);

    const res3 = await 'test/files/book.txt'
      .$read()
      .$match(/Chapter 2/, { before: 100, after: 100 });

    assert(res3 === ['Chapter 1', 'Line 1', 'Line 2', '', 'Chapter 2', 'Line 3', 'Line 4']);

    const res4 = await 'test/files/book.txt'
      .$read()
      .$match(/Line 4/, { before: 100 });

    assert(res4 === ['Chapter 1', 'Line 1', 'Line 2', '', 'Chapter 2', 'Line 3', 'Line 4']);

    const res5 = await 'test/files/book.txt'
      .$read()
      .$match(/Chapter 1/, { after: 100 });

    assert(res5 === ['Chapter 1', 'Line 1', 'Line 2', '', 'Chapter 2', 'Line 3', 'Line 4']);
  }

  @Test()
  async testReplace() {
    const res = await 'test/files/book.txt'
      .$read()
      .$replace(/Chapter/, 'Ch.');

    assert(res[0] === 'Ch. 1');
  }

  @Test()
  async testReplaceObject() {
    const res = await 'test/files/book.txt'
      .$read()
      .$replace({
        Chapter: 'Woops',
        'Chapter 1': 'Ch. Uno',
        'Chapter 2': 'Ch. Deux'
      })
      .$match(/^Ch[.]/);

    assert(res[0] === 'Ch. Uno');
    assert(res[1] === 'Ch. Deux');
  }


  @Test()
  async testTrim() {
    const res = await '  a  \nb         \n        c'
      .split(/\n/g)
      .$trim();

    assert(res === ['a', 'b', 'c']);
  }

  @Test()
  async testToString() {
    const res = await ['  a  \n', 'b         \n', '        c']
      .$trim()
      .$toString();

    assert(res === ['abc']);
  }

  @Test()
  async testToStringTwice() {
    const res = await ['  a  \n', 'b         \n', '        c']
      .$trim()
      .$toString();

    assert(res === ['abc']);
  }
}