import * as readline from 'readline';
import * as zlib from 'zlib';
import { Readable, Writable } from 'stream';

import { $AsyncIterable, IOType } from '../types';
import { StreamUtil } from '../util/stream';

/**
 * Support for dealing with specific data formats as inputs
 */
export class DataOperators {
  /**
   * Converts the inbound JSON string into JS Object by way of `JSON.parse`.  This will
   * operate on individual values in the sequence, so each value should be a
   * complete document.
   *
   * @example
   * `https://jsonplaceholder.typicode.com/todos/1`
   *   .$http() // request url
   *   .$json()  // Convert from JSON
   */
  $json<V = any>(this: AsyncIterable<string>, singleValue = true): $AsyncIterable<V> {
    return (singleValue ? this.$toString() : this)
      .$map(x => JSON.parse(x));
  }

  /**
   * Converts the inbound CSV string into JS Object.  Converts by using simple CSV support and
   * splitting on commas.  Each value in the sequence is assumed to be a single row in the output.
   *
   * @example
   * '<file>.csv'
   *   .$read() // Read file
   *   .$csv(['Name', 'Age', 'Major'])
   *   // Convert to objects from CSV
   */
  $csv<V extends readonly string[]>(this: AsyncIterable<string>, columns: V): $AsyncIterable<Record<V[number], string>> {
    return this.$columns({ names: columns, sep: /,/ });
  }

  /**
   * Will read string values from the input, delimited by new lines
   *
   * @example
   * 'Enter a file name:'
   *   .$prompt() // Request file name
   *   .$read() // Read file
   */
  async * $prompt(this: AsyncIterable<string>, input: Readable = process.stdin, output: Writable = process.stdout): $AsyncIterable<string> {
    let intf: readline.Interface;
    try {
      intf = readline.createInterface({ input, output });

      for await (const message of this) {
        yield await new Promise(res =>
          intf.question(`${message}\n`, res));
      }
    } finally {
      intf!.close();
    }
  }

  /**
   * Compresses inbound binary/text data into compressed stream of Buffers
   *
   * @example
   * __filename
   *  .$read() // Read current file
   *  .$gzip() // Compress
   *  .$write(`${__filename}.gz`)// Store
   */
  async * $gzip(this: AsyncIterable<string | Buffer>): $AsyncIterable<Buffer> {
    const zipper = zlib.createGzip();
    const stream = this.$stream('binary');
    yield* StreamUtil.readStream(stream.pipe(zipper), { mode: 'binary' });
  }

  /**
   * Decompresses inbound gzip'd data into uncompressed stream.
   *
   * 'Hello World'
   *  .$gzip() // Compress
   *  .$gunzip() // Decompress
   *  .$stdout // Prints 'Hello World'
   */
  $gunzip<T extends Buffer>(this: AsyncIterable<T>, mode: 'text'): $AsyncIterable<string>;
  $gunzip<T extends Buffer>(this: AsyncIterable<T>, mode: 'binary'): $AsyncIterable<Buffer>;
  $gunzip<T extends Buffer>(this: AsyncIterable<T>): $AsyncIterable<Buffer>;
  async * $gunzip<T extends Buffer>(this: AsyncIterable<T>, mode?: IOType): $AsyncIterable<Buffer | string> {
    const unzipper = zlib.createGunzip();
    const stream = this.$stream('binary');
    const outbound = stream.pipe(unzipper);

    yield* StreamUtil.readStream(outbound, { mode: mode as 'binary' });
  }
}