import * as assert from 'assert';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class GlobalSuite {

  @Test()
  async testEnv() {
    process.env.AGE = '20';
    assert(env.age === '20');
    assert(env.AGE === '20');
  }

  @Test()
  async testRange() {
    assert(await range(1, 5) === [1, 2, 3, 4, 5]);
    assert(await range(5, 1) === [1, 2, 3, 4, 5]);
    assert(await range(1, 5, 2) === [1, 3, 5]);
  }

  @Test()
  async testArgv() {
    assert(argv.length === process.argv.length - 2);
  }

  @Test()
  async testOf() {
    assert(await of('hi') === ['hi']);
    assert(await of(5) === [5]);
    assert(await of(true) === [true]);
    assert(await of([1, 2, 3]) === [1, 2, 3]);
    assert(await of(new Set([1, 2, 3])) === [1, 2, 3]);
    assert(await of(new Map([[1, 2], [3, 4]])) === [[1, 2], [3, 4]]);
    assert(await of(range(1, 3)) === [1, 2, 3]);
    assert(await of((function* () { yield 1; yield 2; yield 3; })()) === [1, 2, 3]);
  }
}