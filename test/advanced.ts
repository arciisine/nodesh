import * as assert from 'assert';

import { Suite, Test } from '@travetto/test';

import '../src';

@Suite()
export class AdvancedSuite {

  @Test()
  async verifyParallel() {
    const start = Date.now();

    await $range(5)
      .$parallel((el) => el.$wait(100));

    const delta = Date.now() - start;

    assert(delta >= 100);
    assert(delta < 200);
  }

  @Test()
  async verifyParallelSerial() {
    const start = Date.now();

    await $range(5)
      .$parallel((el) => el.$wait(100), { concurrent: 1 });

    const delta = Date.now() - start;

    assert(delta >= 500);
    assert(delta < 600);
  }

  @Test()
  async verifyParallelBatch() {
    const start = Date.now();

    await $range(7)
      .$parallel((el) => el.$wait(100), 3);

    const delta = Date.now() - start;

    assert(delta >= 300);
    assert(delta < 400);
  }

  @Test()
  async verifyOrdering() {
    const res = await $range(5)
      .$sort((a, b) => Math.random() - .5) // Shuffle
      .$parallel((el) => el.$wait(el * 100));

    assert(res === [1, 2, 3, 4, 5]);
  }
}