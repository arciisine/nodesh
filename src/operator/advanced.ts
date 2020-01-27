import * as os from 'os';
import { $AsyncIterable } from '../types';
import { AsyncUtil } from '../util/async';

/**
 * Advanced operators represent more complex use cases.
 */
export class AdvancedOperators {
  /**
   * Run iterator in parallel, returning values in order of first completion.  If the passed in function produces
   * an async generator, only the first value will be used.  This is because the method needs an array of promises
   * and an AsyncIterable cannot produce an array of promises as it's length is unknown until all promises are
   * resolved.
   *
   * The default concurrency limit is number of processors minus one. This means the operator will process the sequence in order
   * until there are `concurrent` pending tasks, and will only fetch the next item once there is capacity.
   *
   * @example
   * [10, 9, 8, 7, 6, 5, 4, 2, 1]
   *  .$parallel(x => (x).$wait(x * 1000))
   *  .$console
   */
  async * $parallel<T, U = T>(this: AsyncIterable<T>, op: (item: T) => AsyncIterable<U> | Promise<U>, concurrent?: number): $AsyncIterable<U> {
    concurrent = concurrent ?? os.cpus().length - 1;

    const items: { p?: Promise<U> }[] = [];

    // Grab first to finish in current batch
    const getNext = function () {
      const prom = Promise.race(items.map(e => e.p!));
      return AsyncUtil.trackWithTimer(prom);
    };

    for await (const el of this) {
      const item = {} as { p?: Promise<U> };
      items.push(item);

      const value = op(el);
      item.p = value as Promise<U>;
      if ('$value' in value && !(value instanceof Promise)) {
        item.p = (value as AsyncIterable<U>).$value;
      }
      item.p = (async () => await item.p)().finally(() => {
        items.splice(items.indexOf(item), 1); // Remove
      }) as Promise<U>;

      if (items.length >= concurrent) {
        yield await getNext();
      }
    }

    while (items.length) {
      yield await getNext();
    }
  }
}