import * as assert from 'assert';
import * as path from 'path';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class ExecSuite {

  @Test()
  async testExecEach() {
    const res = await ['a.txt', 'b.txt', 'c.txt']
      .async
      .map(x => path.resolve(__dirname, 'files', x))
      .execEach('wc', ['-c'])
      .columns(['count'])
      .map(({ count }) => parseInt(count, 10));

    assert(res === [1, 5, 10]);
  }

  @Test()
  async testExec() {
    const data = [
      'a,b,c',
      'd,e,f',
      'g,h,i',
      'j',
      'k,,'
    ];

    const [val] = await data
      .async
      .exec('wc', ['-c'])
      .columns(['count'])
      .map(({ count }) => parseInt(count, 10));

    assert(val === 24);
  }
}