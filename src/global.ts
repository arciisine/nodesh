/// <reference path="./global-patch.d.ts" />

import { GlobalUtil } from './util/global';
import { OrGen } from './util/types';
import { Util } from './util/util';

declare global {
  namespace globalThis {
    /**
     * Provides direct access to stdin as sequence of lines
     */
    const stdin: AsyncGenerator<string>;
    /**
     * The cleaned argv parameters for the running script. Starting at index 0, is the
     * first meaning parameter for the script.
     */
    const argv: string[];
    /**
     * A case insensitive map for accessing environment variables
     */
    const env: Record<string, string>;
    /**
     * Will turn any value into a sequence
     */
    const of: typeof GlobalUtil['of'];
    /**
     *  Produces a numeric range, using with the current value as the end of the range
     */
    const range: (stop: number, start?: number, step?: number) => AsyncGenerator<number>;
  }
}

Object.assign(globalThis, {
  argv: process.argv.slice(3),
  stdin: process.stdin.async,
  of: GlobalUtil.of,
  env: new Proxy({}, {
    get(obj, key: string) {
      return process.env[key] ??
        process.env[key.toUpperCase()] ??
        process.env[key.toLowerCase()];
    }
  }),
  async * range(stop: number, start = 1, step = 1) {
    if (step > 0 && stop < start) {
      const temp = start;
      start = stop;
      stop = temp;
    }
    for (let i = start; i <= stop; i += step) {
      yield i;
    }
  }
});