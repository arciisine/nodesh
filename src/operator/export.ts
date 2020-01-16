import { Readable, Writable } from 'stream';

import { StreamUtil } from '../util/stream';
import { IOType } from '../types';

/**
 * Support for exporting data from a sequence. For all methods that convert the data to a stream (e.g. $write, $writeFinal, $stdout)
 * `Buffer` data implies raw binary data and will be outputted without being processed.
 * Otherwise treat data as line oriented output and will have newlines appended to each sequence element..
 */
export class ExportOperators {
  /**
   * Converts a sequence into a node stream.  This readable stream should be
   * considered standard, and usable in any place a stream is expected.
   * If the mode is specified, it determines if the stream is string or `Buffer` oriented.
   * If the mode is not specified, then `Buffer` data implies raw binary data with no processing.
   * Otherwise treat data as line oriented output (with newlines appended).
   *
   * @example
   * const stream = '<file>.png'
   *   .$read('binary') // Read file as binary
   *   .$exec('convert', ['-size=100x20']) // Pipe to convert function
   *   .$stream('binary') // Read converted output into NodeJS stream
   *
   * stream.pipe(fs.createWriteStream('out.png')); // Write out
   */
  $stream<T>(this: AsyncIterable<T>, mode?: IOType): Readable {
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
  $write<T extends string | Buffer | any>(this: AsyncIterable<T>, writable: Writable | string): Promise<void> {
    const stream = StreamUtil.getWritable(writable);
    this.$stream().pipe(stream);
    return StreamUtil.trackStream(stream);
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
  async $writeFinal(this: AsyncIterable<Buffer | string>, file: string): Promise<void> {
    // Stream to memory
    const mem = StreamUtil.memoryWritable();
    await this.$write(mem);

    // Stream to file
    await mem.store.$write(file);
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
   * Simple method that allows any sequence to be automatically written to stdout.
   * `Buffer` data will be written as is, and all other data will be treated as line-oriented output
   * with newlines appended.
   *
   * @example
   * '<file>'
   *   .$read() // Read file
   *   .$map(line => line.length) // Convert each line to it's length
   *   .$stdout // Pipe to stdout
   */
  get $stdout(this: AsyncIterable<T>): Promise<void> {
    const src = this.$stream();

    // Track completion by input stream, not output as
    // stdout should never close
    const res = StreamUtil.trackStream(src);
    src.pipe(process.stdout);
    return res;
  }

  /**
   * Simple property that allows any sequence to be automatically called with `console.log`.
   * Useful for retaining the structure/formatting (e.g. arrays, objects) of data being processed in the stream.
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