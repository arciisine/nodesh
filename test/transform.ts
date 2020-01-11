import * as assert from 'assert';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class TransformSuite {

  @Test()
  async testNotEmpty() {
    const res = await [null, undefined, '', 5, '    ', 4]
      .$notEmpty();

    assert(res === [5, 4]);
  }

  @Test()
  async testTap() {
    const data: string[] = [];
    const res = await [1, 2, 3, 4]
      .$tap(x => {
        data.push(`${x}`);
      });

    assert(res === [1, 2, 3, 4]);
    assert(data === ['1', '2', '3', '4']);
  }

  @Test()
  async testUnique() {
    const res = await [1, 2, 2, 1, 3, 4, 4, 5, 5, 5, 3, 2]
      .$unique();

    assert(res === [1, 2, 1, 3, 4, 5, 3, 2]);
  }

  @Test()
  async testSort() {
    const res = await [4, 3, 7, 8, 2, 9, 1, 5, 6]
      .$sort();

    assert(res === [1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const res2 = await [4, 3, 7, 8, 2, 9, 1, 5, 6]
      .$sort((a, b) => b - a);

    assert(res2 === [9, 8, 7, 6, 5, 4, 3, 2, 1]);
  }

  @Test()
  async testBatch() {
    const res = await $range(13).$batch(3);

    assert(res.length === 5);
    assert(res[4] === [13]);
    assert(res[2] === [7, 8, 9]);

    const res2 = await $range(4).$batch(1);

    assert(res2 === [[1], [2], [3], [4]]);
  }

  @Test()
  async testPair() {
    const res = await $range(0, 10, 2)
      .$pair($range(0, 5));

    assert(res === [[0, 0], [2, 1], [4, 2], [6, 3], [8, 4], [10, 5]]);

    const res2 = await $range(0, 10, 2)
      .$pair(() => 'a');

    assert(res2 === [[0, 'a'], [2, 'a'], [4, 'a'], [6, 'a'], [8, 'a'], [10, 'a']]);

    const res3 = await $range(0, 10, 2)
      .$pair('a');

    assert(res3 === [[0, 'a'], [2, 'a'], [4, 'a'], [6, 'a'], [8, 'a'], [10, 'a']]);
  }

  @Test()
  async testPairExact() {
    const res = await $range(0, 10, 2)
      .$pair($range(0, 15), 'exact');

    assert(res === [[0, 0], [2, 1], [4, 2], [6, 3], [8, 4], [10, 5]]);

    const res2 = await $range(0, 10, 2)
      .$pair($range(0, 2), 'exact');

    assert(res2 === [[0, 0], [2, 1], [4, 2]]);
  }

  @Test()
  async testPairEmpty() {
    const res = await $range(0, 10, 2)
      .$pair($range(0, 2), 'empty');

    assert(res === [[0, 0], [2, 1], [4, 2], [6, undefined], [8, undefined], [10, undefined]]);
  }

  @Test()
  async testJoin() {
    const res = await $range(5)
      .$map(x => `${x}`)
      .$join('~');

    assert(res === ['1', '~', '2', '~', '3', '~', '4', '~', '5']);

    const res2 = await $range(5)
      .$join(0);

    assert(res2 === [1, 0, 2, 0, 3, 0, 4, 0, 5]);
  }
}