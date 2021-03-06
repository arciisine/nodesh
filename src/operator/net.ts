import * as http from 'http';

import { NetUtil } from '../util/net';
import { $AsyncIterable, HttpOpts, CompletableStream } from '../types';
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
   *   .$tokens($pattern.URL) // Pull out URLs
   */
  $http(this: AsyncIterable<string>, opts?: Omit<HttpOpts, 'mode'>): $AsyncIterable<string>;
  $http(this: AsyncIterable<string>, opts: HttpOpts<'text'>): $AsyncIterable<string>;
  $http(this: AsyncIterable<string>, opts: HttpOpts<'binary'>): $AsyncIterable<Buffer>;
  $http(this: AsyncIterable<string>, opts: HttpOpts<'raw'>): $AsyncIterable<CompletableStream<http.IncomingMessage>>;

  /**
   * This is meant as a simple equivalent of `curl`.  Will fetch a single page (and follow redirects).  By default,
   * it will return lines from the response. Optionally, can return the entire page as a single string, or a sequence
   * of `Buffer`s depending on the options passed in.
   *
   * @example
   * `<sample data file>`
   *   .read('binary') // Now a stream
   *   .$http('https://data-store.biz') // Post data
   *   .$tokens($pattern.URL) // Pull out URLs
   */
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts?: Omit<HttpOpts, 'mode'>): $AsyncIterable<string>;
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts: HttpOpts<'text'>): $AsyncIterable<string>;
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts: HttpOpts<'binary'>): $AsyncIterable<Buffer>;
  $http(this: AsyncIterable<string | Buffer>, url: URL | string, opts: HttpOpts<'raw'>): $AsyncIterable<CompletableStream<http.IncomingMessage>>;
  async * $http(
    this: AsyncIterable<string>, urlOrOpts: string | URL | HttpOpts = {}, defOpts?: HttpOpts
  ): $AsyncIterable<string | Buffer | CompletableStream<http.IncomingMessage>> {
    if (typeof urlOrOpts === 'string' || urlOrOpts instanceof URL) {
      const opts = { mode: 'text', ...(defOpts ?? {}), data: this };
      yield* NetUtil.httpRequest(urlOrOpts, opts);
    } else {
      for await (const url of this) {
        yield* NetUtil.httpRequest(url, { mode: 'text', ...urlOrOpts });
      }
    }
  }
}
