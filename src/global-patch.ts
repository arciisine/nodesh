/// <reference path="./global-patch.d.ts" />

import { Readable } from 'stream';

import { GlobalUtil } from './util/global';
import { Util } from './util/util';
import { RegisterUtil } from './util/register';


[
  Boolean, Number, String, RegExp,
  Array, Set, Map,
  Util.gen,
  Readable
]
  .forEach(
    cons => RegisterUtil.properties({
      async(this: any) {
        return GlobalUtil.of(this);
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
        });

        return this;
      };
    }
  }
}, Util.asyncGen.prototype);