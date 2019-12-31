import { HttpOpts, NetUtil } from '../util/net';
import { IOType } from '../util/stream';

/**
 * Support for network based activities
 */
export class NetOperators {
  /**
   * This is meant as a simple equivalent of `curl`.  Will fetch a single page (and follow redirects).  By default,
   * it will return lines from the response. Optionally, can return the entire page as a single string, or a sequence
   * of `Buffer`s depending on the options passed in.
   * 
   * @example
   * `https://en.wikipedia.org/wiki/Special:Random`
   *   .async
   *   .fetch() // Request URL
   *   .match('URL', 'extract') // Pull out URLs
   */
  fetch(this: AsyncGenerator<string>, output: 'binary', opts?: HttpOpts): AsyncGenerator<Buffer>;
  fetch(this: AsyncGenerator<string>, output: 'line' | 'text', opts?: HttpOpts): AsyncGenerator<string>;
  fetch(this: AsyncGenerator<string>): AsyncGenerator<string>;
  async *fetch(this: AsyncGenerator<string>, output?: IOType, opts?: HttpOpts): AsyncGenerator<string | Buffer, any, any> {
    for await (const url of this) {
      yield* (await NetUtil.fetch(url, output, opts));
    }
  }
}
