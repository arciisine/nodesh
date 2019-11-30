import * as tty from 'tty';
import * as stream from 'stream';

import { StreamUtil } from './stream';

export class GlobalUtil {
  /**
   * Produce an async generator from any value
   */
  static of<T>(val: AsyncIterable<T>): AsyncGenerator<T>; // eslint-disable-line
  static of<T>(val: Iterable<T>): AsyncGenerator<T>; // eslint-disable-line
  static of(val: String): AsyncGenerator<string>; // eslint-disable-line
  static async * of<T extends object>(val: T | Iterable<T> | AsyncIterable<T>): AsyncGenerator<T> {
    if (val.constructor === String) {
      yield val as T;
    } else if ((val as any)[Symbol.iterator]) {
      yield* (val as any);
    } else if ((val as any)[Symbol.asyncIterator]) {
      yield* (val as any);
    } else if (val instanceof stream.Readable || val instanceof tty.ReadStream) {
      yield* StreamUtil.readStream(val) as AsyncGenerator<any>;
    } else {
      yield val as T;
    }
  }
}
