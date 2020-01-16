import { OrCallable, PromFunc, PromFunc2, $AsyncIterable } from '../types';
import { GlobalHelpers } from '../helper';

export type PairMode = 'empty' | 'repeat' | 'exact';
export type AsyncCompare<T> = PromFunc2<T, T, boolean>;

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
  $unique<T>(this: AsyncIterable<T>): $AsyncIterable<T>;


  /**
   * `$unique` also supports configuration for custom comparators, as well as the ability to count the values as they come through.
   *
   * @example
   * [1, 2, 2, 2, 3, 4, 5, 5]
   *   .$unique({ count: true }) // Will produce [[1, 1], [2, 3], [3, 1], [4, 1], [5, 2]]
   *
   * @example
   * [0, 2, 2, 2, 4, 1, 3, 2]
   *   .$unique({ count: true, compare: (x,y) => x%2 === y%2 })
   *   // Will produce [0, 1, 3, 2] as it captures the first even or odd of a run
   */
  $unique<T>(this: AsyncIterable<T>, config: { compare?: AsyncCompare<T>, count: true }): $AsyncIterable<[T, number]>;
  $unique<T>(this: AsyncIterable<T>, config: { compare?: AsyncCompare<T>, count?: false }): $AsyncIterable<T>;
  async * $unique<T>(this: AsyncIterable<T>, config?: { compare?: AsyncCompare<T>, count?: boolean }): $AsyncIterable<T | [T, number]> {
    let last: T = Symbol as any;
    let count = 0;
    const compare = config?.compare ?? ((x: T, y: T) => x === y);
    const doCount = !!config?.count;

    function* emit(item: T): Generator<T | [T, number]> {
      if (last !== Symbol as any) {
        if (doCount) {
          yield [last, count];
        } else {
          yield last;
        }
      }
      last = item;
      count = 1;
    }

    for await (const item of this) {
      if (!(await compare(item, last))) {
        yield* emit(item);
      } else {
        count += 1;
      }
    }
    yield* emit(undefined as any);
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
  async * $pair<T, U>(this: AsyncIterable<T>, value: OrCallable<U | Iterable<U> | AsyncIterable<U>>, mode?: PairMode): $AsyncIterable<[T, U]> {
    if (['function', 'object'].includes(typeof value) && 'apply' in value) {
      value = value();
    }

    mode = mode ?? (typeof value === 'string' ? 'repeat' : 'empty');

    let suppl = (value as any as AsyncIterable<T>).$iterable;
    if (mode === 'repeat') {
      suppl = suppl.$repeat();
    }
    let itr = suppl[Symbol.asyncIterator]();

    for await (const el of this) {
      const res = await itr.next();
      if (res.done) {
        if (mode === 'exact') {
          break;
        } else if (mode === 'empty') {
          itr = [undefined!].$repeat()[Symbol.asyncIterator]();
          res.value = undefined;
        }
      }
      const v = res.value;
      yield [el, v];
    }
  }

  /**
   * This operator allows for combining a sequence of elements with a join element
   *
   * @example
   * '<file>'
   *   .$read() // Read as a series of lines
   *   .$join('\n')
   *   // Produces a sequence of lines inter-spliced with new lines
   */
  async * $join<T>(this: AsyncIterable<T>, joiner: T | $AsyncIterable<T>): $AsyncIterable<T> {
    const itr = this[Symbol.asyncIterator]();
    let result;
    const joinItr = GlobalHelpers.$of(joiner as any).$repeat()[Symbol.asyncIterator]();
    let first = true;

    while (true) {
      result = await itr.next();
      if (result.done) {
        break;
      }
      if (!first) {
        yield (await joinItr.next()).value;
      } else {
        first = false;
      }
      yield result.value;
    }
  }

  /**
   * Combine multiple streams, linearly
   *
   * @example
   * $range(1, 10)
   *  .$concat($range(11, 20), $range(21, 30))
   *  .$collect()
   *  .$map(all => all.length)
   *  .$stdout; // Displays 30
   */
  async * $concat<T>(this: AsyncIterable<T>, other: AsyncIterable<T>, ...rest: AsyncIterable<T>[]) {
    for (const itr of [this, other, ...rest]) {
      for await (const item of itr) {
        yield item;
      }
    }
  }
}