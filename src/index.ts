/// <reference path="./global.d.ts" />

import { Readable } from 'stream';
import * as path from 'path';
import * as fs from 'fs';

import { AsyncGeneratorCons, GeneratorCons } from './types';
import { RegisterUtil } from './util/register';
import { GlobalHelpers } from './helper';

const supportedAsyncableTypes = [
  Boolean, Number, String, RegExp,
  Array, Set, Map,
  GeneratorCons, AsyncGeneratorCons, Readable
];

const supportedThenableTypes = [
  AsyncGeneratorCons
];

function initialize() {

  // Supported async types
  supportedAsyncableTypes
    .forEach(RegisterUtil.registerAsyncable);

  // Supported thenable types
  supportedThenableTypes
    .forEach(RegisterUtil.registerThenable);

  // Register globals
  Object.defineProperties(globalThis,
    Object.getOwnPropertyDescriptors(
      GlobalHelpers.prototype)
  );

  // Supported operators
  const operators = fs
    .readdirSync(path.resolve(__dirname, 'operator'))
    .filter(x => !x.endsWith('.d.ts'))
    .map(x => path.resolve(__dirname, 'operator', x))
    .map(require)
    .flatMap(Object.values);

  RegisterUtil.registerOperators(operators, AsyncGeneratorCons);
}

initialize();