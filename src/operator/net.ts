import { NetUtil } from '../util/net';
import { $AsyncIterable, HttpOpts } from '../types';

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
   *   .$http() // Request URL
   *   .$match($pattern.URL, 'extract') // Pull out URLs
   */
  $http(this: AsyncIterable<string>, opts: HttpOpts<'binary'>): $AsyncIterable<Buffer>;
  $http(this: AsyncIterable<string>, opts: HttpOpts<'text'>): $AsyncIterable<string>;
  $http(this: AsyncIterable<string>, opts?: Omit<HttpOpts, 'mode'>): $AsyncIterable<string>;

  /**
   * This is meant as a simple equivalent of `curl`.  Will fetch a single page (and follow redirects).  By default,
   * it will return lines from the response. Optionally, can return the entire page as a single string, or a sequence
   * of `Buffer`s depending on the options passed in.
   *
   * @example
   * `<sample data file>`
   *   .read('binary') // Now a stream
   *   .$http('https://data-store.biz') // Post data
   *   .$match($pattern.URL, 'extract') // Pull out URLs
   */
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts: HttpOpts<'binary'>): $AsyncIterable<Buffer>;
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts: HttpOpts<'text'>): $AsyncIterable<string>;
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts?: Omit<HttpOpts, 'mode'>): $AsyncIterable<string>;
  async * $http(this: AsyncIterable<string>, urlOrOpts: string | URL | HttpOpts = {}, defOpts?: HttpOpts): $AsyncIterable<string | Buffer> {
    if (typeof urlOrOpts === 'string' || urlOrOpts instanceof URL) {
      const opts = defOpts ?? {};
      opts.data = this;
      opts.method = opts.method ?? 'POST';
      NetUtil.fetch(urlOrOpts, opts);
    } else {
      for await (const url of this) {
        yield* await NetUtil.fetch(url, urlOrOpts);
      }
    }
  }
}
