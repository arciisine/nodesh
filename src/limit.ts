import { RegisterUtil } from './util/register';

declare global {
  interface AsyncGenerator<T> {
    /**
     * This will return the first `n` elements with a default of a single element.
     */
    first(n?: number): AsyncGenerator<T>;
    /**
     * This will return all but the first `n` elements.
     */
    skip(n: number): AsyncGenerator<T>;
    /**
     * This will return the last `n` elements with a default of a single element.
     */
    last(n?: number): AsyncGenerator<T>;
    /**
     * This will repeat the first `n` elements with a default of all elements.
     */
    repeat(n?: number): AsyncGenerator<T>;
  }
}

RegisterUtil.operators({
  async * first(n: number = 1) {
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
  },
  async * last(n: number = 1) {
    if (!(n >= 1)) {
      throw new Error('Invalid amount for last(). Must be >= 1');
    }

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
          yield buffer.shift(); // Yield first
        }
      }
    }
  },
  async * repeat(n: number = -1) {
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
});
