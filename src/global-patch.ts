/// <reference path="./global-patch.d.ts" />

import * as stream from 'stream';
import * as tty from 'tty';

import { GlobalUtil } from './util/global';
import { Util } from './util/util';


[
  Boolean, Number, String, RegExp,
  Array, Set, Map,
  Util.gen, Util.asyncGen,
  stream.Readable, tty.ReadStream
]
  .forEach(
    cons => Object.defineProperty(cons.prototype, 'async', {
      get() { return GlobalUtil.of(this); }
    }));
