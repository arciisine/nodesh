import './global';
import './patch';

import * as path from 'path';
import * as fs from 'fs';
import { Readable } from 'stream';

import { RegisterUtil } from './util/register';
import { GlobalHelpers } from './helper';
import { StreamUtil } from './util/stream';

function initialize() {

  // Supported operators
  const operators = fs
    .readdirSync(path.resolve(__dirname, 'operator'))
    .filter(x => !x.endsWith('.d.ts'))
    .map(x => path.resolve(__dirname, 'operator', x))
    .map(require)
    .reduce((acc, v) => ([...acc, ...Object.values(v)]), []);

  // Supported async types
  RegisterUtil.registerOperators(operators, Object);
  RegisterUtil.registerAsyncable(Object);

  // Special cases
  RegisterUtil.properties({
    $iterable(this: Readable) { return StreamUtil.readStream(this); }
  }, Readable.prototype);

  RegisterUtil.properties({
    async * $iterable(this: string) { yield this; }
  }, String.prototype);

  RegisterUtil.properties({
    async * $iterable(this: Buffer) { yield this; }
  }, Buffer.prototype);

  // Register globals
  const helperProps = Object.getOwnPropertyDescriptors(GlobalHelpers);
  delete helperProps.prototype;
  Object.defineProperties(globalThis, helperProps);

  // Make generators thenable, but only on node 11+
  if (parseInt(process.version.replace(/^v/i, '').split('.')[0], 10) > 10) {
    const { constructor: AsyncGeneratorCons } = (async function* () { })();
    RegisterUtil.registerThenable(AsyncGeneratorCons);
  }
}

initialize();