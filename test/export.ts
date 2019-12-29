import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';

import { Suite, Test } from '@travetto/test';

import { StreamUtil } from '../src/util/stream';
import '../src/index';

@Suite()
export class ExportSuite {
  a = `
  stdout: void
  console: void`;

  @Test()
  async testStream() {
    const temp = StreamUtil.memoryWritable();
    '1\n2\n3\n'
      .async
      .stream()
      .pipe(temp);

    await new Promise(r => temp.once('finish', r));

    assert(temp.getText() === '1\n2\n3\n');
  }

  @Test()
  async testWrite() {
    const temp = StreamUtil.memoryWritable();
    '1\n2\n3\n'
      .async
      .write(temp);

    await new Promise(r => temp.once('finish', r));

    assert(temp.getText() === '1\n2\n3\n');
  }

  @Test()
  async testWriteFinal() {
    const uuid = crypto.randomBytes(16).toString('hex');
    const temp = path.join(os.tmpdir(), uuid);

    await '1\n2\n3\n'
      .async
      .writeFinal(temp);

    assert(await temp.async.read('text').value === '1\n2\n3\n');
  }

  @Test()
  async testValues() {
    const ret = await [[1], [2], [3]]
      .async
      .flatten()
      .values;

    assert(ret === [1, 2, 3]);
  }

  @Test()
  async testValue() {
    const ret = await [[1], [2], [3]]
      .async
      .flatten()
      .value;

    assert(ret === 1);
  }
}