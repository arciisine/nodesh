import * as http from 'http';
import * as https from 'https';

import { StreamUtil } from './stream';
import { HttpOpts } from '../types';

export class NetUtil {
  static request(url: string, opts: HttpOpts = {}) {
    return new Promise<http.IncomingMessage>((res, rej) => {
      const src = (url.startsWith('https') ? https.request : http.request)(url, opts, res);
      if (opts.data) {
        opts.data.$stream().pipe(src);
      }
      src.once('error', rej);
      src.end();
    });
  }

  /**
   * Make an http request, and return the contents appropriately
   */
  static fetch(url: string | URL, opts: HttpOpts<'text'>): AsyncIterable<string>;
  static fetch(url: string | URL, outs: HttpOpts<'binary'>): AsyncIterable<Buffer>;
  static fetch(url: string | URL, opts?: Omit<HttpOpts, 'mode'>): AsyncIterable<string>;
  static async* fetch(url: string, opts: HttpOpts = {}): AsyncIterable<string | Buffer> {
    let level = 0;

    while (level < 6) {
      const msg = await this.request(url, opts);
      // If redirected
      if (msg.statusCode && msg.statusCode >= 300 && msg.statusCode < 400 && msg.headers.location) {
        if (level === 5) {
          throw new Error(`Error fetching ${url}: too many redirect`);
        }
        url = msg.headers.location;
        level += 1;
        continue;
      } else if (msg.statusCode && msg.statusCode > 299) {
        throw new Error(`Error fetching ${url}: ${msg.statusMessage}`);
      } else {
        yield* StreamUtil.readStream(msg, opts);
        return;
      }
    }
  }
}
