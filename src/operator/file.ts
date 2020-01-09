import * as path from 'path';

import { StreamUtil } from '../util/stream';
import { FileUtil, ScanEntry } from '../util/file';

import { $AsyncIterable, ReadDirConfig, ReadStreamConfig, IOType } from '../types';


/**
 * Some of the most common shell operations are iterating through files,
 * and operating upon those files.  To support this, the framework supports
 * producing files as a sequence of file objects or filenames, given a file
 * extension or a regex pattern. With `String`s and `RegExp`s supporting the
 * `Symbol.asyncIterator` property, these are the most common way of finding files.
 */
export class FileOperators {
  /**
   * This operator will treat the inbound string sequence as file names, and will convert the filename (based on IOType)
   * * `text` (default) - The sequence will produce as series of lines of text
   * * `binary` - The sequence will produce a series of `Buffer` objects
   *
   * If singleValue is set to true, this produce a single value for the whole stream instead of chunk by chunk.  This
   * mode can be easier to work with for certain operations, but is much more memory intensive.
   *
   * @example
   * '<file>'
   *   .$read('binary') // Read as a series of buffers
   *   .$reduce((acc, buffer) => {
   *     return acc  + buffer.length;
   *   }, 0); // Count number of bytes in file
   *
   * @example
   * '<file>'
   *   .$read('binary', true) // Read as a single buffer
   *   .$map(buffer => buffer.length) // Count number of bytes in file
   *
   */
  $read(this: AsyncIterable<string>, config?: Omit<ReadStreamConfig, 'mode'>): $AsyncIterable<string>
  $read(this: AsyncIterable<string>, config: ReadStreamConfig<'text'>): $AsyncIterable<string>
  $read(this: AsyncIterable<string>, config: ReadStreamConfig<'binary'>): $AsyncIterable<Buffer>;
  async * $read(this: AsyncIterable<string>, config: ReadStreamConfig<IOType> = {}): $AsyncIterable<string | Buffer> {
    for await (const file of this) {
      yield* StreamUtil.readStream(file, config);
    }
  }

  /**
   * `dir` provides the ability to recursively search for files within a file system.  It expects as the
   * input sequence type:
   * * A `string` which represents a suffix search on file names (e.g. `.csv`)
   * * A `RegExp` which represents a file pattern to search on (e.g. `/path\/sub\/.*[.]js/`)
   *
   * In addition to the input sequence type, there is an optional config to affect the output.
   * By default the output of this sequence will be a series of file names, relative to the `process.cwd()`
   * that will be eligible for reading or any other file operation.
   *
   * @example
   * '.csv'
   *   .$dir({ full: true }) // List all '.csv' files, recursively
   *   .$forEach(f => {
   *     // Display the filename, and it's modification time
   *     console.log(f.file, f.stats.mtime);
   *   });
   */
  $dir(this: AsyncIterable<string | RegExp>, config: ReadDirConfig & { full: true }): $AsyncIterable<ScanEntry>;
  $dir(this: AsyncIterable<string | RegExp>, config?: Omit<ReadDirConfig, 'full'>): $AsyncIterable<string>;
  async * $dir(this: AsyncIterable<string | RegExp>, config: ReadDirConfig = { base: process.cwd() }): $AsyncIterable<ScanEntry | string> {
    config.base = path.resolve(process.cwd(), config.base! || ''); // relative to working directory, but pull path

    for await (const pattern of this) {
      const testFile =
        typeof pattern === 'string' ?
          (x: string) => x.endsWith(pattern) :
          (x: string) => pattern.test(x);

      yield* FileUtil.scanDir({ testFile }, config.base!).$map(x => config.full ? x : x.file);
    }
  }
}
