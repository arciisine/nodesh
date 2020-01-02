import { OrCallable, OrAsyncStream, PromFunc, PromFunc2, $AsyncIterable } from '../types';
import { AsyncUtil } from '../util/async';

export type PairMode = 'empty' | 'repeat' | 'exact';

/**
 * Standard operators regarding common patterns for transformations
 */
export class TransformOperators {
  /**
   * This is a special type of filter that excludes `null`, `undefined` and `''`.
   * Useful for removing empty values.
   *
   * @example
   * '<file>'
   *   .$read()
   *   .$notEmpty() // Return all non-empty lines of the file
   */
  $notEmpty<T>(this: AsyncIterable<T>): $AsyncIterable<T> {
    return this.$filter(x => x !== undefined && x !== null && (typeof x !== 'string' || x.trim() !== ''));
  }

  /**
   * `$tap` provides the ability to inspect the sequence without affecting it's production.  The function passed in
   * can produce a promise that will be waited on, if needed.
   *
   * @example
   * '.csv'
   *   .$dir()
   *   .$tap(({stats}) => collectMetrics(stats))
   *   // Stream unchanged, but was able to track file stat information
   */
  async * $tap<T>(this: AsyncIterable<T>, visit?: PromFunc<T, any>): $AsyncIterable<T> {
    for await (const item of this) {
      if (visit) {
        await visit(item);
      }
      yield item;
    }
  }

  /**
   * `$unique` will ensure the output sequence does not have any consecutive duplicates, similar to the unix `uniq` command.
   * The uniqueness is only guaranteed linearly, to allow for streaming.  Otherwise this would need to wait
   * for all data before proceeding.  You can also specify a custom equality function as needed.
   *
   * @example
   * [1, 2, 2, 3, 4, 5, 5, 1, 7]
   *   .$unique() // Will produce [1, 2, 3, 4, 5, 1, 7]
   *   // The final 1 repeats as it's not duplicated in sequence
   */
  async * $unique<T>(this: AsyncIterable<T>, compare: PromFunc2<T, T, boolean> = (x, y) => x === y): $AsyncIterable<T> {
    let last = undefined;

    for await (const item of this) {
      if (!(await compare(item, last!))) {
        last = item;
        yield item;
      }
    }
  }

  /**
   * `$sort` is a blocking operation as it requires all the data to be able to sort properly.  This means it will wait
   * on the entire sequence before producing new data.  The function operates identically to how `Array.prototype.sort` behaves.
   *
   * @example
   * '<file>'
   *   .$read() // Now a sequence of lines
   *   .$sort() // Sort lines alphabetically
   *   // Now a sequence of sorted lines
   */
  async * $sort<T>(this: AsyncIterable<T>, compare?: (a: T, b: T) => number): $AsyncIterable<T> {
    for await (const set of this.$collect()) {
      yield* set.sort(compare);
    }
  }

  /**
   * Allows for iterative grouping of streamed data, and produces a sequence of arrays.  Each array will be `$batch` sized,
   * except for the final array which will be at most `batch` size.
   *
   * @example
   * '<file>'
   *   .$read() // Generator of file lines
   *   .$batch(20) // Generator of array of lines, at most 20 items in length
   *   .$map(lines => lines.sort()) // Sort each batch
   *   // Generator of sorted list strings
   */
  async * $batch<T>(this: AsyncIterable<T>, size: number): $AsyncIterable<T[]> {
    let out = [];
    for await (const item of this) {
      out.push(item);
      if (out.length === size) {
        yield out;
        out = [];
      }
    }
    if (out.length) {
      yield out;
    }
  }

  /**
   * `$pair` allows for combining two sets of data into a single sequence of pairs.
   * The second value can either be a single value, which will be added to every item,
   * or it could be an iterable element that will match with each item as possible. If the second
   * iterator runs out, the remaining values can be affected by the mode parameter:
   * * `'empty'`  - Fill in with `undefined` once the second iterator is exhausted.  This is default for iterable values.
   * * `'repeat'` - Loop iteration on the secondary iterator.  This is default for string values.
   * * `'exact'`  - Stop the emitting values once the secondary iterator is exhausted.
   *
   * @example
   * '.ts'
   *   .$dir() // List all '.ts' files
   *   .$flatMap(file => file
   *     .$read() // Read each file as a sequence of lines
   *     .$pair(file) // Combine each line with the file name
   *     .$map(([a,b]) => [b, a]) // Reverse the order of the columns
   *   )
   *   // Generator of file lines with, file name attached
   */
  async * $pair<T, U>(this: AsyncIterable<T>, value: OrCallable<OrAsyncStream<U>>, mode?: PairMode): $AsyncIterable<[T, U]> {
    if (['function', 'object'].includes(typeof value) && 'apply' in value) {
      value = value();
    }

    mode = mode ?? (typeof value === 'string' ? 'repeat' : 'empty');

    let suppl = AsyncUtil.toIterable(value);
    if (mode === 'repeat') {
      suppl = suppl.$repeat();
    }
    let itr = AsyncUtil.toIterator(suppl);

    for await (const el of this) {
      const res = await itr.next();
      if (res.done) {
        if (mode === 'exact') {
          break;
        } else if (mode === 'empty') {
          itr = AsyncUtil.toIterator([undefined!].$repeat());
          res.value = undefined;
        }
      }
      const v = res.value;
      yield [el, v];
    }
  }
}