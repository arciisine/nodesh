import './global';
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
    .flatMap(Object.values);

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

  // Finish out Thenable
  const { constructor: AsyncGeneratorCons } = ((async function* () { })());
  RegisterUtil.registerThenable(AsyncGeneratorCons);

  // Register globals
  const helperProps = Object.getOwnPropertyDescriptors(GlobalHelpers);
  delete helperProps.prototype;
  Object.defineProperties(globalThis, helperProps);
}

initialize();