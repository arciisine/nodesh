import * as stream from 'stream';

import { AsyncStream, AsyncGeneratorCons, OrAsyncStream } from '../types';
import { StreamUtil } from './stream';


export class AsyncUtil {
  static async * ofOne<T>(e: T) {
    yield e;
  }

  static async * ofAll<T>(e: Iterable<T> | AsyncIterable<T>) {
    yield* e;
  }

  /**
   * Produce an async generator from any value
   */
  static toGenerator<T>(val: AsyncGenerator<T>): AsyncGenerator<T>; // eslint-disable-line
  static toGenerator<T>(val: AsyncIterable<T>): AsyncGenerator<T>; // eslint-disable-line
  static toGenerator<T>(val: Iterable<T>): AsyncGenerator<T>; // eslint-disable-line
  static toGenerator<T>(val: T): AsyncGenerator<T>; // eslint-disable-line
  static toGenerator<T extends object>(val: OrAsyncStream<T>): AsyncGenerator<T> {
    if (val === null || val === undefined || typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return AsyncUtil.ofOne(val);
    } else if (val.constructor === AsyncGeneratorCons) {
      return val as AsyncGenerator<T>;
    } else if (val instanceof stream.Readable) {
      return StreamUtil.readStream(val) as AsyncGenerator<any>;
    } else if (Symbol.iterator in val || Symbol.asyncIterator in val) {
      return AsyncUtil.ofAll(AsyncUtil.asIterable(val as AsyncStream<T>));
    } else {
      return AsyncUtil.ofOne(val as T);
    }
  }

  /**
   * Ensure AsyncStream object returns as AsyncIterable
   * @param val
   */
  static asIterable<T>(val: AsyncStream<T>): AsyncIterable<T> | Iterable<T> {
    if (Symbol.asyncIterator in val) {
      return val as AsyncIterable<T>;
    } else if (Symbol.iterator in val) {
      return val as Iterable<T>;
    } else if ('$' in val) {
      return AsyncUtil.asIterable(val.$);
    } else {
      throw new Error('Unknown iterable type');
    }
  }
}