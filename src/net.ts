import { HttpOpts, NetUtil } from './util/net';
import { RegisterUtil } from './util/register';
import { IOType } from './util/stream';


declare global {
  interface AsyncGenerator<T> {
    /**
     * This is meant as a simple equivalent of `curl`.  Will fetch a single page (and follow redirects).  By default,
     * it will return lines from the response. Optionally, can return the entire page as a single string, or a sequence
     * of `Buffer`s depending on the options passed in.
     */
    fetch(this: AsyncGenerator<string>, output: 'binary', opts?: HttpOpts): AsyncGenerator<Buffer>;
    fetch(this: AsyncGenerator<string>, output: 'line' | 'text', opts?: HttpOpts): AsyncGenerator<string>;
    fetch(this: AsyncGenerator<string>, opts?: HttpOpts): AsyncGenerator<string>;
  }
}

RegisterUtil.operators({
  async *fetch(this: AsyncGenerator<string>, output?: IOType, opts?: HttpOpts) {
    for await (const url of this) {
      yield* (await NetUtil.fetch(url, output, opts));
    }
  }
});