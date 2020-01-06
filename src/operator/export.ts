import { Readable, Writable } from 'stream';

import { StreamUtil } from '../util/stream';

import { IOType } from '../types';
import { TimeUtil } from '../util/time';
import { AsyncUtil } from '../util/async';

/**
 * Support for exporting data from a sequence
 */
export class ExportOperators {
  /**
   * Converts a sequence into a node stream.  This readable stream should be
   * considered standard, and usable in any place a stream is expected. The mode
   * determines if the stream is string or `Buffer` oriented.
   *
   * @example
   * const stream = '<file>.png'
   *   .$read('binary') // Read file as binary
   *   .$exec('convert', ['-size=100x20']) // Pipe to convert function
   *   .$stream('binary') // Read converted output into NodeJS stream
   *
   * stream.pipe(fs.createWriteStream('out.png')); // Write out
   */
  $stream<T>(this: AsyncIterable<T>, mode: IOType = 'text'): Readable {
    return StreamUtil.toStream(this, mode);
  }

  /**
   * Emits the sequence contents to a write stream.  If the write stream is a string, it
   * is considered to be a file name. Buffer contents are written as is.  String contents
   * are written as lines.
   *
   * @example
   * '<file>.png'
   *   .$read('binary') // Read file as binary
   *   .$exec('convert', ['-size=100x20']) // Pipe to convert function
   *   .$write('out.png') // Write file out
   */
  $write<T extends string | Buffer | any>(this: AsyncIterable<T>, writable: Writable | string): Writable {
    return this.$stream().pipe(StreamUtil.getWritable(writable));
  }

  /**
   * Writes the entire stream to a file, as a final step. The write stream will not be created until all the values
   * have been emitted.  This is useful for reading and writing the same file.
   *
   * @example
   * '<file>'
   *   .$read()
   *   .$replace(/TEMP/, 'final')
   *   .$writeFinal('<file>');
   */
  async $writeFinal(this: AsyncIterable<string>, file: string): Promise<void> {
    const [text] = await this.$join();
    const str = StreamUtil.getWritable(file);
    await new Promise(r => str.write(text, r));
    str.end();
  }
}

export class ExportPropOperators<T> {
  /**
   * Extract all sequence contents into a single array and return
   * as a promise
   *
   * @example
   * const values = await '<file>.csv'
   *   .$read()
   *   .$csv('Width', 'Depth', 'Height'])// Convert to objects
   *   .$map(({Width, Height, Depth}) =>
   *     int(Width) * int(Height) * int(Depth) // Compute volume
   *   )
   *   .$values // Get all values;
   */
  get $values(this: AsyncIterable<T>): Promise<T[]> {
    return this.$collect().$value;
  }

  /**
   * Extract first sequence element and return as a promise
   *
   * @example
   * const name = await 'What is your name?'
   *   .$prompt() // Prompt for name
   *   .$value  // Get single value
   */
  get $value(this: AsyncIterable<T>): Promise<T> {
    return (async () => {
      const itr = this[Symbol.asyncIterator]();
      const out = (await itr.next()).value;
      if (itr.return) {
        itr.return(undefined); // End it
      }
      return out;
    })();
  }

  /**
   * Simple method that allows any sequence to be automatically written to stdout
   *
   * @example
   * '<file>'
   *   .$read() // Read file
   *   .$map(line => line.length) // Convert each line to it's length
   *   .$stdout // Pipe to stdout
   */
  get $stdout(this: AsyncIterable<T>): Writable {
    const src = this.$stream('line');

    // Track completion by input stream, not output as
    // stdout should never close
    StreamUtil.trackStream(src);

    return src.pipe(process.stdout);
  }

  /**
   * Simple property that allows any sequence to be automatically called with `console.log`
   *
   * @example
   * '<file>'
   *  .$read() // Read file
   *  .$json()
   *  .$console // Log out objects
   */
  get $console(this: AsyncIterable<T>): Promise<void> {
    return this.$forEach(console.log);
  }
}