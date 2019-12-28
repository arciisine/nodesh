import { RegisterUtil } from './util/register';
import { OrProm, Gen, Reducer } from './util/types';

declare global {
  interface AsyncGenerator<T = unknown, TReturn = any, TNext = unknown> {
    /**
     * Converts the sequence of data into another, by applying an operation
     * on each element.
     * @param fn
     */
    map<U>(fn: (item: T) => OrProm<U>): AsyncGenerator<U, TReturn, TNext>;
    /**
     * Determines if items in the sequence are valid or not. Invalid items
     * are discarded, while valid items are retained.
     * @param pred
     */
    filter(pred: (item: T) => OrProm<boolean>): AsyncGenerator<T, TReturn, TNext>;
    /**
     * This operator is a terminal action that receives each element of the sequence in sequence,
     * but returns no value.  This function produces a promise that should be waited on to ensure the
     * sequence is exhausted.
     * @param fn
     */
    forEach(fn: (item: T) => OrProm<any>): Promise<void>;

    /**
     * Flattens a sequence of arrays, or a sequence of sequences.  This allows for operators that
     * return arrays/sequences, to be able to be represented as a single sequence.
     * @param this
     */
    flatten<U>(this: AsyncGenerator<U[], TReturn, TNext> | AsyncGenerator<AsyncGenerator<U>, TReturn, TNext>): AsyncGenerator<U, TReturn, TNext>;
    /**
     * This is a combination of `map` and `flatten` as they are common enough in usage to warrant a
     * combined operator.  This will map the the contents of the sequence (which produces an array
     * or sequence), and producing a flattened output.
     * @param fn
     */
    flatMap<U>(fn: (item: T) => Gen<U> | { async: AsyncGenerator<U> }): AsyncGenerator<U, TReturn, TNext>;
    /**
     * This is the standard reduce operator and behaves similarly as `Array.prototype.reduce`.  This operator
     * takes in an accumulation function, which allows for computing a single value based on visiting each element
     * in the sequence.  Given that reduce is a comprehensive and produces a singular value, this operation cannot
     * stream and will block until the stream is exhausted. Normally it is common to understand `map` and `filter` as
     * being implemented by `reduce`, but in this situation they behave differently.
     * @param fn
     * @param acc
     */
    reduce<U>(fn: Reducer<U, T> & { init: () => U }, acc?: U): AsyncGenerator<U, TReturn, TNext>;
    reduce<U>(fn: Reducer<U, T>, acc: U): AsyncGenerator<U, TReturn, TNext>;

    /**
     * Gathers the entire sequence output as a single array.  This is useful if you need the entire stream to perform an action.
     */
    collect(this: AsyncGenerator<T, TReturn, TNext>): AsyncGenerator<T[], TReturn, TNext>;

    /**
     * This is the simplest mechanism for extending the framework as the operator takes in a function that operates on the sequence of
     * data as a whole.  It will consume the sequence and produce an entirely new sequence.
     */
    wrap<U, UReturn = any, UNext = unknown>(
      fn: (iter: AsyncGenerator<T, TReturn, TNext>) => AsyncGenerator<U, UReturn, UNext>
    ): AsyncGenerator<U, UReturn, UNext>;

    /**
     * If an error occurs, use the provided sequence instead
     */
    onError<U = T>(alt: OrCall<AsyncGenerator<U>>): AsyncGenerator<U>;
  }
}

RegisterUtil.operators({
  async forEach<T>(this: AsyncGenerator<T>, fn: (x: T) => OrProm<any>) {
    for await (const item of this) {
      await fn(item);
    }
  }
});

RegisterUtil.operators({
  async * map<U, T>(this: AsyncGenerator<T>, fn: (x: T) => OrProm<U>) {
    for await (const item of this) {
      yield (await fn(item));
    }
  },
  async * filter(pred: (x: any) => OrProm<boolean>) {
    for await (const item of this) {
      if (await pred(item)) {
        yield item;
      }
    }
  },
  async * flatten() {
    for await (const item of this) {
      yield* item;
    }
  },
  async * flatMap<T, U>(this: AsyncGenerator<T>, fn: (x: T) => Gen<U> | { async: AsyncGenerator<U> }) {
    for await (const el of this) {
      const val = await fn(el);
      const res = ('async' in val ? val.async : val) as AsyncGenerator<U>;
      for await (const sub of res) {
        yield sub;
      }
    }
  },
  async * reduce<T, U>(this: AsyncGenerator<T>, fn: Reducer<U, T> & { init?: () => U }, acc: U | undefined) {
    if (acc === undefined) {
      acc = fn.init!();
    }
    for await (const item of this) {
      acc = await fn(acc, item);
    }
    yield acc;
  },
  collect<T, U>(this: AsyncGenerator<T>) {
    return this
      .reduce((acc, el) => {
        acc.push(el);
        return acc;
      }, [] as T[]);
  },
  async * wrap<T extends AsyncGenerator, U extends AsyncGenerator>(this: T, fn: (input: T) => U) {
    yield* fn(this);
  },
  async * onError<T extends AsyncGenerator>(this: T, alt: AsyncGenerator<T> | (() => AsyncGenerator<T>)) {
    try {
      yield* this;
    } catch (err) {
      yield* ('apply' in alt ? alt() : alt);
    }
  }
});