import * as http from 'http';

import { NetUtil } from '../util/net';
import { $AsyncIterable, HttpOpts } from '../types';
import { Readable } from 'stream';

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
  $http(this: AsyncIterable<string>, opts?: Omit<HttpOpts, 'mode'>): $AsyncIterable<string>;
  $http(this: AsyncIterable<string>, opts: HttpOpts<'text'>): $AsyncIterable<string>;
  $http(this: AsyncIterable<string>, opts: HttpOpts<'binary'>): $AsyncIterable<Buffer>;
  $http(this: AsyncIterable<string>, opts: HttpOpts<'raw'>): $AsyncIterable<http.IncomingMessage>;

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
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts?: Omit<HttpOpts, 'mode'>): $AsyncIterable<string>;
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts: HttpOpts<'text'>): $AsyncIterable<string>;
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts: HttpOpts<'binary'>): $AsyncIterable<Buffer>;
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts: HttpOpts<'raw'>): $AsyncIterable<http.IncomingMessage>;
  async * $http(this: AsyncIterable<string>, urlOrOpts: string | URL | HttpOpts = {}, defOpts?: HttpOpts): $AsyncIterable<string | Buffer | http.IncomingMessage> {
    if (typeof urlOrOpts === 'string' || urlOrOpts instanceof URL) {
      const opts = {
        method: 'POST',
        data: this,
        ...(defOpts ?? {})
      };
      const res = await NetUtil.httpRequest(urlOrOpts, opts);

      if (res instanceof http.IncomingMessage) {
        yield res;
      } else {
        yield* res;
      }
    } else {
      for await (const url of this) {
        const res = await NetUtil.httpRequest(url, urlOrOpts);
        if (res instanceof http.IncomingMessage) {
          yield res;
        } else {
          yield* res;
        }
      }
    }
  }
}
