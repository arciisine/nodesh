import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class GlobalPatchSuite {

  @Test()
  async testPrimitives() {
    assert(await (5).async.value === 5);
    assert(await '5'.async.value === '5');
    // @ts-ignore
    assert(await /5/g.async.value instanceof RegExp);
    // @ts-ignore
    assert(await (true).async.value === true);
  }

  @Test()
  async testCollections() {
    assert(await [1].async === [1]);
    assert(await new Set([3, 1]).async.sort() === [1, 3]);
    assert(await new Map([['k1', 'v1'], ['k2', 'v2']]).async === [['k1', 'v1'], ['k2', 'v2']]);
  }

  @Test()
  async testGenerators() {
    function* count() {
      for (let i = 0; i < 10; i++) {
        yield i;
      }
    }

    assert(await count().async.last().value === 9);

    async function* countAsync() {
      for (let i = 0; i < 10; i++) {
        yield await i;
      }
    }

    assert(await countAsync().async.last().value === 9);

    const iter = countAsync();
    assert(iter === iter.async);
  }

  @Test()
  async testStreams() {
    const lines = await fs.createReadStream('./test/files/book.txt')
      .async;

    assert(lines.length === 7);
  }
}