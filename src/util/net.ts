import * as http from 'http';
import * as https from 'https';

import { StreamUtil } from './stream';
import { HttpOpts } from '../types';
import { Readable } from 'stream';

export class NetUtil {
  static request(url: string, opts: http.RequestOptions = {}, data?: AsyncIterable<string | Buffer>) {
    const client = (url.startsWith('https') ? https.request : http.request);
    return new Promise<http.IncomingMessage>((res, rej) => {
      const src = client(url, opts, res);
      src.once('error', rej);
      if (data) {
        data.$stream().pipe(src);
      } else {
        src.end();
      }
    });
  }

  /**
   * Make an http request, and return the contents appropriately
   */
  static httpRequest(url: string | URL, opts?: Omit<HttpOpts, 'mode'>): AsyncIterable<string>;
  static httpRequest(url: string | URL, opts: HttpOpts<'text'>): AsyncIterable<string>;
  static httpRequest(url: string | URL, outs: HttpOpts<'binary'>): AsyncIterable<Buffer>;
  static httpRequest(url: string | URL, outs: HttpOpts<'raw'>): AsyncIterable<http.IncomingMessage>;
  static async* httpRequest(url: string, opts: HttpOpts = {}): AsyncIterable<string | Buffer | http.IncomingMessage> {
    let level = 0;
    // Compute once
    const reqOpts = {
      timeout: opts.timeout ?? 30000,
      method: opts.method ?? 'GET',
      headers: {
        ...opts.headers ?? {},
        [`Content-Type`]: opts.contentType ?? 'application/octet-stream'
      }
    };

    while (level < 6) {
      const msg = await this.request(url, reqOpts, opts.data);
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
        const res = StreamUtil.readStream(msg, opts);
        if (res instanceof http.IncomingMessage) {
          yield res as http.IncomingMessage;
        } else {
          yield* res;
        }
        return;
      }
    }
  }
}
