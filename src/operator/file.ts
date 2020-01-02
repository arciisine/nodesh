import * as path from 'path';

import { StreamUtil } from '../util/stream';
import { FileUtil, ScanEntry } from '../util/file';

import { IOType } from '../types';

type DirConfig = { base?: string, full?: boolean };

/**
 * Some of the most common shell operations are iterating through files,
 * and operating upon those files.  To support this, the framework supports
 * producing files as a sequence of file objects or filenames, given a file
 * extension or a regex pattern. With `String`s and `RegExp`s supporting the
 * `.$` property, these are the most common way of finding files.
 */
export class FileOperators {
  /**
   * This operator will treat the inbound string sequence as file names, and will convert the filename (based on IOType)
   * * `line` (default) - The sequence will produce as series of lines of text
   * * `text` - The sequence will produce the entire file contents as a single text string
   * * `binary` - The sequence will produce a series of `Buffer` objects
   *
   * @example
   * '<file>'.$ //  Now a sequence of a single value, a file name
   *   .read('binary') // Read as a series of buffers
   *   .reduce((acc, buffer) => {
   *     return acc  + buffer.length;
   *   }, 0); // Count number of bytes in file
   *
   * @example
   * '<file>'.$ //  Now a sequence of a single value, a file name
   *   .read('text') // Read as a single string
   *   .map(text => text.length); // Count number of characters in file
   *
   */
  read(this: AsyncGenerator<string>, type: 'binary'): AsyncGenerator<Buffer>;
  read(this: AsyncGenerator<string>, type?: IOType): AsyncGenerator<string>;
  read(this: AsyncGenerator<string>, type: 'line' | 'text'): AsyncGenerator<string>;
  async * read(this: AsyncGenerator<string>, type: IOType = 'line'): AsyncGenerator<string | Buffer> {
    for await (const file of this) {
      yield* StreamUtil.readStream(file, type);
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
   * '.csv'.$
   *   .dir({ full: true }) // List all '.csv' files, recursively
   *   .forEach(f => {
   *     // Display the filename, and it's modification time
   *     console.log(f.file, f.stats.mtime);
   *   });
   */
  dir(this: AsyncGenerator<string | RegExp>, config: Omit<DirConfig, 'full'> & { full: true }): AsyncGenerator<ScanEntry>;
  dir(this: AsyncGenerator<string | RegExp>, config: DirConfig): AsyncGenerator<string>;
  dir(this: AsyncGenerator<string | RegExp>): AsyncGenerator<string>;
  dir(this: AsyncGenerator<string | RegExp>, config?: DirConfig): AsyncGenerator<string | ScanEntry>;
  async * dir(this: AsyncGenerator<string | RegExp>, config: DirConfig = { base: process.cwd() }) {
    config.base = path.resolve(process.cwd(), config.base! || ''); // relative to working directory, but pull path

    for await (const pattern of this) {
      const testFile =
        typeof pattern === 'string' ?
          (x: string) => x.endsWith(pattern) :
          (x: string) => pattern.test(x);

      yield* FileUtil.scanDir({ testFile }, config.base!).map(x => config.full ? x : x.file);
    }
  }
}
