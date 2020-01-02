import * as assert from 'assert';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class LimitSuite {

  @Test()
  async testFirst() {
    const badGen = function* () {
      yield 1;
      while (true as any) {
      }
      yield 2;
    };

    const [val] = await badGen().$first();
    assert(val === 1);
  }

  @Test()
  async testSkip() {
    const [val] = await $range(4).$skip(3);
    assert(val === 4);
  }

  @Test()
  async testSkipNegative() {
    const val = await $range(4)
      .$skip(-1);

    assert(val === [1, 2, 3]);
  }


  @Test()
  async testLast() {
    const val = await $range(4)
      .$last(2);

    assert(val === [3, 4]);
  }

  @Test()
  async testRepeat() {
    const vals = await $range(2)
      .$repeat()
      .$first(4);

    assert(vals === [1, 2, 1, 2]);
  }

  @Test()
  async testRepeatLimited() {
    const vals = await $range(0, 2)
      .$repeat(10);

    assert(vals === [0, 1, 2, 0, 1, 2, 0, 1, 2, 0]);
  }

  @Test()
  async testRepeatLimitedWithIter() {
    const vals = await $range(0, 2)
      .$repeat(5);

    assert(vals === [0, 1, 2, 0, 1]);
  }
}