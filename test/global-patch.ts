import * as assert from 'assert';
import * as fs from 'fs';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class GlobalPatchSuite {

  @Test()
  async testPrimitives() {
    assert(await $of(5) === [5]);
    assert(await $of('5') === ['5']);
    // @ts-ignore
    assert((await $of(/5/g))[0] instanceof RegExp);
    // @ts-ignore
    assert((await $of(true))[0] === true);
  }

  @Test()
  async testCollections() {
    assert(await $of([1]) === [1]);
    assert(await new Set([3, 1]).$sort() === [1, 3]);
    assert(await $of(new Map([['k1', 'v1'], ['k2', 'v2']])) === [['k1', 'v1'], ['k2', 'v2']]);
  }

  @Test()
  async testGenerators() {
    function* count() {
      for (let i = 0; i < 10; i++) {
        yield i;
      }
    }

    assert(await count().$last() === [9]);

    async function* countAsync() {
      for (let i = 0; i < 10; i++) {
        yield await i;
      }
    }

    assert(await countAsync().$last() === [9]);
  }

  @Test()
  async testStreams() {
    const lines = await fs.createReadStream('./test/files/book.txt').$values;

    console.log(lines);

    assert(lines.length === 7);
  }
}