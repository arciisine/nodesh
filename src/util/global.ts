import * as stream from 'stream';

import { StreamUtil } from './stream';
import { Util } from './util';
import { OrGen } from './types';

export class GlobalUtil {
  /**
   * Produce an async generator from any value
   */
  static of<T>(val: AsyncGenerator<T>): AsyncGenerator<T>; // eslint-disable-line
  static of<T>(val: AsyncIterable<T>): AsyncGenerator<T>; // eslint-disable-line
  static of<T>(val: Iterable<T>): AsyncGenerator<T>; // eslint-disable-line
  static of<T>(val: T): AsyncGenerator<T>; // eslint-disable-line
  static async * of<T extends object>(val: OrGen<T>): AsyncGenerator<T> {
    if (val === null || val === undefined || typeof val === 'string') {
      yield val as T;
    } else if (val instanceof Util.asyncGen) {
      return val;
    } else if (val instanceof stream.Readable) {
      yield* StreamUtil.readStream(val) as AsyncGenerator<any>;
    } else if ((val as any)[Symbol.iterator] || (val as any)[Symbol.asyncIterator]) {
      yield* (val as any);
    } else {
      yield val as T;
    }
  }
}
