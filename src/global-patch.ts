/// <reference path="./global-patch.d.ts" />

import * as stream from 'stream';
import * as tty from 'tty';

import { GlobalUtil } from './util/global';
import { Util } from './util/util';
import { RegisterUtil } from './util/register';


[
  Boolean, Number, String, RegExp,
  Array, Set, Map,
  Util.gen,
  stream.Readable, tty.ReadStream
]
  .forEach(
    cons => RegisterUtil.properties({
      async: {
        get(this: any) {
          return GlobalUtil.of(this);
        }
      }
    }, cons.prototype)
  );

RegisterUtil.properties({
  async: {
    get() { return this; }
  },
  then: {
    get() {
      return (fn: Function) => {
        Promise.resolve().then(() => {
          fn((this as any).values);
        })

        return this;
      }
    }
  }
}, Util.asyncGen.prototype)