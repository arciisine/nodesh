import * as assert from 'assert';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class CoreSuite {

  @Test()
  async testMap() {
    const val = await ([1, 2, 3].$.map(x => x ** 2));
    assert(val === [1, 4, 9]);
  }

  @Test()
  async testMapPromise() {
    const val = await [1, 2, 3].$
      .map(x => Promise.resolve(x ** 2));
    assert(val === [1, 4, 9]);
  }

  @Test()
  async testFilter() {
    const val = await ([1, 2, 3].$.filter(x => x > 2));
    assert(val === [3]);
  }

  @Test()
  async testFilterPromise() {
    const val = await [1, 2, 3].$
      .filter(async x => x > 2);
    assert(val === [3]);
  }

  @Test()
  async testForEach() {
    let sum = 0;
    await [1, 2, 3].$.forEach(x => sum += x);
    assert(sum === 6);
  }

  @Test()
  async testFlatten() {
    const vals = (await [[1, 2], [3, 4], [5, 6]].$.flatten());
    assert(vals === [1, 2, 3, 4, 5, 6]);
  }

  @Test()
  async testFlatMap() {
    const vals = (await [[1, 2], [3, 4], [5, 6]].$
      .flatMap(pair => [Math.max(...pair)])
    );
    assert(vals === [2, 4, 6]);
  }

  @Test()
  async testFlatMapPromise() {
    const vals = (await [[1, 2], [3, 4], [5, 6]].$
      .flatMap(async pair => [Math.max(...pair)])
    );
    assert(vals === [2, 4, 6]);
  }

  @Test()
  async testReduce() {
    const sum = (await [1, 2, 3, 4, 5, 6].$
      .reduce((acc, v) => acc + v, 0)
      .value
    );
    assert(sum === 21);

    const sumWithDefault = (acc: number, v: number) => acc + v;
    sumWithDefault.init = () => 0;

    const sum2 = (await [1, 2, 3, 4]
      .$
      .reduce(sumWithDefault)
      .value
    );
    assert(sum2 === 10);
  }

  @Test()
  async testCollect() {
    let mx = 0;
    await [1, 2, 3, 4, 5].$.collect().forEach(all => mx = Math.max(...all));
    assert(mx === 5);
  }

  @Test()
  async testWrap() {
    const vals = await (
      [3, 4, 5, 6].$
        .wrap(async function* (seq) {
          while (true) {
            const res = await seq.next();
            if (res.done) {
              break;
            }
            const el = res.value;
            yield el % 2 === 0 ? el / 2 : el ** 2;
          }
        }));

    assert(vals === [9, 2, 25, 3]);
  }

  @Test()
  async onError() {
    const ret = await (async function* () {
      yield -1 as number;
      yield 0;
      throw new Error('Uhoho');
    })()
      .onError([1, 2, 3].$);

    assert(ret === [-1, 0, 1, 2, 3]);
  }
}