import * as stream from 'stream';

import { AsyncGeneratorCons, OrAsyncStream, $AsyncIterable } from '../types';
import { StreamUtil } from './stream';


export class AsyncUtil {
  static async * yield<T>(itr: Iterable<T>): $AsyncIterable<T> {
    yield* itr;
  }

  /**
   * Produce an async generator from any value
   */
  static toIterable<T>(val: stream.Readable): $AsyncIterable<string>; // eslint-disable-line
  static toIterable<T>(val: AsyncGenerator<T>): $AsyncIterable<T>; // eslint-disable-line
  static toIterable<T>(val: AsyncIterable<T>): $AsyncIterable<T>; // eslint-disable-line
  static toIterable<T>(val: Iterable<T>): $AsyncIterable<T>; // eslint-disable-line
  static toIterable<T>(val: T): $AsyncIterable<T>; // eslint-disable-line
  static toIterable<T>(val: OrAsyncStream<T>): $AsyncIterable<T> {
    if (val === null || val === undefined || typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return AsyncUtil.yield([val]);
    } else if ((val as AsyncGenerator).constructor === AsyncGeneratorCons) {
      return val as $AsyncIterable<T>;
    } else if (val instanceof stream.Readable) {
      return StreamUtil.readStream(val) as $AsyncIterable<any>;
    } else if (Symbol.asyncIterator in val) {
      return val as $AsyncIterable<T>;
    } else if (Symbol.iterator in val) {
      return AsyncUtil.yield(val as Iterable<T>);
    } else {
      return AsyncUtil.yield([val as T]);
    }
  }

  static toIterator<T>(val: AsyncIterable<T>): AsyncIterator<T> {
    return val[Symbol.asyncIterator]();
  }
}