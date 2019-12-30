import { RegisterUtil } from './util/register';
import { OrProm, OrCall, OrGen } from './util/types';

type PairMode = 'empty' | 'repeat' | 'exact';

declare global {
  interface AsyncGenerator<T> {
    /**
     * This is a special type of filter that excludes `null`, `undefined` and `''`.
     * Useful for removing empty values.
     */
    notEmpty(): AsyncGenerator<T>;
    /**
     * Provides the ability to inspect the sequence without affecting it's production.  The function passed in
     * can produce a promise that will be waited on, if needed.
     */
    tap(visit?: (item: T) => OrProm<any>): AsyncGenerator<T>;
    /**
     * Ensures the output sequence does not have any consecutive duplicates, similar to the unix `uniq` command.
     * The uniqueness is only guaranteed linearly, to allow for streaming.  Otherwise this would need to wait
     * for all data before proceeding.  You can also specify a custom equality function as needed.
     */
    unique(this: AsyncGenerator<T>, equal?: (a: T, b: T) => OrProm<boolean>): AsyncGenerator<T>;
    /**
     * A blocking operation as it requires all the data to be able to sort properly.  This means it will wait on the entire sequence
     * before producing new data.  The function operates identically to how `Array.prototype.sort`.
     */
    sort(this: AsyncGenerator<T>, compare?: (a: T, b: T) => number): AsyncGenerator<T>;
    /**
     * Allows for iterative grouping of streamed data, and produces a sequence of arrays.  Each array will be `batch` sized,
     * except for the final array which will be at most `batch` size.
     */
    batch(size: number): AsyncGenerator<T[]>;

    /**
     * Allows for combining two sets of data into a single sequence of pairs.  The second value can either be a single value,
     * which will be added to every item, or it could be an iterable element that will match with each item as possible. If
     * the second iterator runs out, the remaining values can be affected by the mode parameter
     */
    pair<U>(this: AsyncGenerator<T>, value: OrCall<OrGen<U>>, mode?: PairMode): AsyncGenerator<[T, U]>;
  }
}

RegisterUtil.operators({
  notEmpty() {
    return this.filter(x => x !== undefined && x !== null && (typeof x !== 'string' || x.trim() !== ''));
  },
  async * tap(fn?: (x: any) => any) {
    for await (const item of this) {
      if (fn) {
        await fn(item);
      }
      yield item;
    }
  },
  async * unique(check: (x: any, y: any) => OrProm<boolean> = (x, y) => x === y) {
    let last = undefined;

    for await (const item of this) {
      if (!(await check(item, last))) {
        last = item;
        yield item;
      }
    }
  },
  async * sort(compare?: (x: any, y: any) => number) {
    for await (const set of this.collect()) {
      yield* set.sort(compare);
    }
  },
  async * batch(size: number) {
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
  },
  async * pair<U, T>(this: AsyncGenerator<T>, value: OrCall<OrGen<U>>, mode?: PairMode): AsyncGenerator<[T, U]> {
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
});