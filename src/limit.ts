import { RegisterUtil } from './util/register';

declare global {
  interface AsyncGenerator<T = unknown, TReturn = any, TNext = unknown> {
    /**
     * This will return the first `n` elements with a default of a single element.
     */
    first(n?: number): AsyncGenerator<T, TReturn, TNext>;
    /**
     * This will return all but the first `n` elements.
     */
    skip(n: number): AsyncGenerator<T, TReturn, TNext>;
    /**
     * This will return the last `n` elements with a default of a single element.
     */
    last(n?: number): AsyncGenerator<T, TReturn, TNext>;
    /**
     * This will repeat the first `n` elements with a default of all elements.
     */
    repeat(n?: number): AsyncGenerator<T, TReturn, TNext>;
  }
}

RegisterUtil.operators({
  async * first(n: number = 1) {
    for await (const item of this) {
      yield item;
      n -= 1;
      if (n <= 0) {
        break;
      }
    }
  },
  async * last(n: number = 1) {
    const out = [];
    for await (const item of this) {
      out.push(item);
      if (out.length > n) {
        out.shift();
      }
    }
    yield* out;
  },
  async * skip(n: number) {
    for await (const item of this) {
      n -= 1;
      if (n > 0) {
        continue;
      }
      yield item;
    }
  },
  async * repeat(n: number = Number.MAX_SAFE_INTEGER) {
    const buffer = [];
    let readCount = 0;
    for await (const v of this) {
      if (readCount >= n) {
        break;
      }
      buffer.push(v);
      yield v;
      readCount += 1;
    }

    const off = buffer.length;
    while (readCount < n) {
      yield buffer[(readCount - off) % off];
      readCount += 1;
    }
  }
});
