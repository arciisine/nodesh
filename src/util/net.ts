import * as http from 'http';
import * as https from 'https';

import { IOType, StreamUtil } from './stream';

export type HttpOpts = http.RequestOptions & { output?: IOType };

export class NetUtil {
  /**
   * Make an http request, and return the contents appropriately
   */
  static fetch(url: string, output?: IOType, opts?: HttpOpts, level?: number): AsyncGenerator<string | Buffer>;
  static fetch(url: string, output: 'line' | 'text', opts?: HttpOpts): AsyncGenerator<string>;
  static fetch(url: string, output: 'binary', opts?: HttpOpts): AsyncGenerator<Buffer>;
  static async* fetch(url: string, output: IOType = 'line', opts: HttpOpts = {}, level = 0): AsyncGenerator<string | Buffer> {
    const messageProm = new Promise<http.IncomingMessage>((res, rej) => {
      const src = (url.startsWith('https') ? https.request : http.request)(url, opts, res);
      src.once('error', rej);
      src.end();
    });

    const msg = (await messageProm);
    if (level < 5 && msg.statusCode && msg.statusCode >= 300 && msg.statusCode < 400 && msg.headers.location) {
      yield* NetUtil.fetch(msg.headers.location, output, opts, level + 1);
    } else {
      if (msg.statusCode && msg.statusCode > 299) {
        throw new Error(`Error fetching ${url}: ${msg.statusMessage}`);
      } else {
        yield* StreamUtil.readStream(msg, output ?? 'line');
      }
    }
  }
}
