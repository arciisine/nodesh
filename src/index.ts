import './global';
import * as path from 'path';
import * as fs from 'fs';

import { AsyncGeneratorCons } from './types';
import { RegisterUtil } from './util/register';
import { GlobalHelpers } from './helper';

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

  // Finish out Thenable
  RegisterUtil.registerThenable(AsyncGeneratorCons);

  // Register globals
  Object.defineProperties(globalThis,
    Object.getOwnPropertyDescriptors(
      GlobalHelpers.prototype)
  );
}

initialize();