import { $AsyncIterable } from '../types';

/**
 * Support for limiting sequence values based on ordering
 */
export class LimitOperators {
  /**
   * This will return the first `n` elements with a default of a single element.
   * @example
   * '<file>'
   *   .$read()
   *   .$first(10) // Read first 10 lines

   * @example
   * '<file>'
   *   .$read()
   *   .$first() // Read first line
   */
  async * $first<T>(this: AsyncIterable<T>, n: number = 1): $AsyncIterable<T> {
    if (!(n >= 1)) {
      throw new Error('Invalid amount for first(). Must be >= 1');
    }

    for await (const item of this) {
      yield item;
      n -= 1;
      if (n <= 0) {
        break;
      }
    }
  }

  /**
   * This will return all but the first `n` elements.
   *
   * @example
   * '<file>.csv'
   *   .$read()
   *   .$skip(1) // Skip header
   */
  async * $skip<T>(this: AsyncIterable<T>, n: number): $AsyncIterable<T> {
    if (Number.isNaN(n) || n === 0) {
      throw new Error('Invalid amount for skip(). Must be >= 1 or <= -1');
    }

    if (n > 0) {
      for await (const item of this) {
        n -= 1;
        if (n >= 0) {
          continue;
        }
        yield item;
      }
    } else {
      n = Math.abs(n);
      const buffer = [];
      for await (const item of this) {
        buffer.push(item);
        if (buffer.length > n) {
          yield buffer.shift()!; // Yield first
        }
      }
    }
  }

  /**
   * This will return the last `n` elements with a default of a single element.
   * Since this method requires knowledge of the length of the sequence to
   * work properly, this now becomes a blocking operator.
   *
   * @example
   * '<file>'
   *   .$read()
   *   .$last(7) // Read last 7 lines of file
   *
   * @example
   * '<file>'
   *   .$read()
   *   .$last() // Read last line of file
   */
  async * $last<T>(this: AsyncIterable<T>, n: number = 1): $AsyncIterable<T> {
    if (!(n >= 1)) {
      throw new Error('Invalid amount for last(). Must be >= 1');
    }

    const out: T[] = [];
    for await (const item of this) {
      out.push(item);
      if (out.length > n) {
        out.shift();
      }
    }
    yield* out;
  }

  /**
   * This will repeat the first `n` elements with a default of all elements.
   *
   * @example
   * '<file>'
   *   .$read()
   *   .$first(10) // Read first 10 lines
   */
  async * $repeat<T>(this: AsyncIterable<T>, n: number = -1): $AsyncIterable<T> {
    const buffer = [];
    let readCount = 0;

    if (n < 0) {
      n = Number.MAX_SAFE_INTEGER;
    }

    for await (const v of this) {
      if (buffer.length >= n) {
        break;
      }
      buffer.push(v);
      yield v;
      readCount += 1;
    }

    const off = buffer.length;
    while (readCount < n) {
      yield buffer[readCount++ % off];
    }
  }
}