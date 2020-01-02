import { HttpOpts, NetUtil } from '../util/net';
import { IOType, $AsyncIterable } from '../types';

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
   *   .$fetch() // Request URL
   *   .$match('URL', 'extract') // Pull out URLs
   */
  $fetch(this: AsyncIterable<string>, output: 'binary', opts?: HttpOpts): $AsyncIterable<Buffer>;
  $fetch(this: AsyncIterable<string>, output: 'line' | 'text', opts?: HttpOpts): $AsyncIterable<string>;
  $fetch(this: AsyncIterable<string>): $AsyncIterable<string>;
  async * $fetch(this: AsyncIterable<string>, output?: IOType, opts?: HttpOpts): $AsyncIterable<string | Buffer> {
    for await (const url of this) {
      yield* (await NetUtil.fetch(url, output, opts));
    }
  }
}
