import * as assert from 'assert';
import * as path from 'path';
import * as stream from 'stream';

import { Suite, Test } from '@travetto/test';

import '../src/index';
import { StreamUtil } from '../src/util/stream';

@Suite()
export class ExecSuite {

  @Test()
  async testExecEach() {
    const res = await ['a.txt', 'b.txt', 'c.txt']
      .$map(x => path.resolve(__dirname, 'files', x))
      .$flatMap(args =>
        ''.$exec('wc', { args: ['-c', args] })
      )
      .$columns(['count'])
      .$map(({ count }) => parseInt(count, 10));

    assert(res === [1, 5, 10]);
  }

  @Test()
  async testExec() {
    const data = `
a,b,c
d,e,f
g,h,i
j,
k,,`;

    const [val] = await data.trim()
      .$exec('wc', { args: ['-c'] })
      .$columns(['count'])
      .$map(({ count }) => parseInt(count, 10));

    assert(val === 24);
  }

  @Test()
  async verifyRaw() {
    const [{ stream: str, completed }] = await $exec('ls', { mode: 'raw' });
    assert(str !== undefined);

    assert(str instanceof stream.Readable);

    str.pipe(StreamUtil.memoryWritable()); // Capture

    await completed;
  }
}