import { OrProm, OrCall, OrGen } from '../types';

type PairMode = 'empty' | 'repeat' | 'exact';

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
   *   .async
   *   .read()
   *   .notEmpty() // Return all non-empty lines of the file
   */
  notEmpty<T>(this: AsyncGenerator<T>): AsyncGenerator<T> {
    return this.filter(x => x !== undefined && x !== null && (typeof x !== 'string' || x.trim() !== ''));

  }
  /**
   * `tap` provides the ability to inspect the sequence without affecting it's production.  The function passed in
   * can produce a promise that will be waited on, if needed.
   * 
   * @example
   * '.csv'
   *   .async
   *   .dir()
   *   .tap(({stats}) => collectMetrics(stats)) 
   *   // Stream unchanged, but was able to track file stat information
   */
  async * tap<T>(this: AsyncGenerator<T>, visit?: (item: T) => OrProm<any>): AsyncGenerator<T> {
    for await (const item of this) {
      if (visit) {
        await visit(item);
      }
      yield item;
    }
  }
  /**
   * `unique` will ensure the output sequence does not have any consecutive duplicates, similar to the unix `uniq` command.
   * The uniqueness is only guaranteed linearly, to allow for streaming.  Otherwise this would need to wait
   * for all data before proceeding.  You can also specify a custom equality function as needed.
   * 
   * @example
   * [1, 2, 2, 3, 4, 5, 5, 1, 7]
   *   .async
   *   .unique() // Will produce [1, 2, 3, 4, 5, 1, 7]
   *   // The final 1 repeats as it's not duplicated in sequence 
   */
  async * unique<T>(this: AsyncGenerator<T>, compare: (a: T, b: T) => OrProm<boolean> = (x, y) => x === y): AsyncGenerator<T> {
    let last = undefined;

    for await (const item of this) {
      if (!(await compare(item, last!))) {
        last = item;
        yield item;
      }
    }
  }
  /**
   * `sort` is a blocking operation as it requires all the data to be able to sort properly.  This means it will wait 
   * on the entire sequence before producing new data.  The function operates identically to how `Array.prototype.sort` behaves.
   * 
   * @example
   * '<file>'
   *   .async
   *   .read() // Now a sequence of lines
   *   .sort() // Sort lines alphabetically
   *   // Now a sequence of sorted lines
   */
  async * sort<T>(this: AsyncGenerator<T>, compare?: (a: T, b: T) => number): AsyncGenerator<T, any, any> {
    for await (const set of this.collect()) {
      yield* set.sort(compare);
    }
  }
  /**
   * Allows for iterative grouping of streamed data, and produces a sequence of arrays.  Each array will be `batch` sized,
   * except for the final array which will be at most `batch` size.
   * 
   * @example
   * '<file>'
   *   .async
   *   .read() // Generator of file lines
   *   .batch(20) // Generator of array of lines, at most 20 items in length
   *   .map(lines => lines.sort()) // Sort each batch
   *   // Generator of sorted list strings
   */
  async * batch<T>(this: AsyncGenerator<T>, size: number): AsyncGenerator<T[]> {
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
   * `pair` allows for combining two sets of data into a single sequence of pairs.  
   * The second value can either be a single value, which will be added to every item, 
   * or it could be an iterable element that will match with each item as possible. If the second 
   * iterator runs out, the remaining values can be affected by the mode parameter:
   * * `'empty'`  - Fill in with `undefined` once the second iterator is exhausted.  This is default for iterable values.
   * * `'repeat'` - Loop iteration on the secondary iterator.  This is default for string values.
   * * `'exact'`  - Stop the emitting values once the secondary iterator is exhausted.
   * 
   * @example
   * '.ts'
   *   .async
   *   .dir() // List all '.ts' files
   *   .flatMap(file => file.async
   *     .read() // Read each file as a sequence of lines
   *     .pair(file) // Combine each line with the file name
   *     .map(([a,b]) => [b, a]) // Reverse the order of the columns
   *   )
   *   // Generator of file lines with, file name attached
   */
  async * pair<T, U>(this: AsyncGenerator<T>, value: OrCall<OrGen<U>>, mode?: PairMode): AsyncGenerator<[T, U]> {
    if (['function', 'object'].includes(typeof value) && 'apply' in value) {
      value = value();
    }

    mode = mode ?? (typeof value === 'string' ? 'repeat' : 'empty');

    let suppl = of(value);
    if (mode === 'repeat') {
      suppl = suppl.repeat();
    }
    for await (const el of this) {
      const res = await suppl.next();
      if (res.done) {
        if (mode === 'exact') {
          break;
        } else if (mode === 'empty') {
          suppl = of([undefined!]).repeat();
          res.value = undefined;
        }
      }
      const v = res.value;
      yield [el, v];
    }
  }
}