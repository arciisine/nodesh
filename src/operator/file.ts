import * as path from 'path';
import * as fs from 'fs';

import { StreamUtil } from '../util/stream';
import { FileUtil, ScanEntry } from '../util/file';

import { $AsyncIterable, ReadDirConfig, ReadStreamConfig, ReadTextLineConfig, IOType } from '../types';

type Line = { text: string, number: number, file: string };

/**
 * Some of the most common shell operations are iterating through files,
 * and operating upon those files.  To support this, the framework supports
 * producing files as a sequence of file objects or filenames, given a file
 * extension or a regex pattern. With `String`s and `RegExp`s supporting the
 * `Symbol.asyncIterator` property, these are the most common way of finding files.
 */
export class FileOperators {

  /**
   * This operator will read a text file as a series of `Line` objects, which include the file name,
   * line number, and associated text.
   *
   * When `mode` is `text` or undefined, the result will be a series of string in the format `{{file}}:{{number}} {{text}}`
   * When `mode` is 'object', the result will be the raw `Line` objects
   *
   * When in `text` mode, the line number, and file name can be toggled off as needed by passing in additional config.
   *
   * @example
   * '<file>'
   *   .$readLines({ number:false }) // Read as a series of lines, without numbering
   *
   * @example
   * '<file>'
   *   .$readLines({ mode:'object' }) // Read as a series of line objects
   *   .$filter(line => line.number === 5) // Read only 5th line
   *
   * @example
   * '.js'
   *   .$dir()
   *   .$readLines() // Read as a series of lines, with filename, line number prepended
   */
  $readLines(this: AsyncIterable<string>, config: ReadTextLineConfig<'text'>): $AsyncIterable<string>;
  $readLines(this: AsyncIterable<string>, config: { mode: 'object' }): $AsyncIterable<Line>;
  $readLines(this: AsyncIterable<string>): $AsyncIterable<string>;
  async * $readLines(this: AsyncIterable<string>, config: ReadTextLineConfig = {}): $AsyncIterable<Line | string> {
    for await (const file of this) {
      let i = 0;
      const out = StreamUtil
        .readStream(file, { mode: 'text' })
        .$map(line => ({
          number: ++i,
          file: config.base ? file.replace(config.base, '.') : file,
          text: line
        }));
      if (config.mode === 'object') {
        yield* out;
      } else {
        yield* out.$map(line => {
          let prefix = '';
          if (config.number !== false) {
            const padding = line.number >= 100 ? '' : line.number >= 10 ? ' ' : '  ';
            prefix = `${padding}${line.number}`;
          }
          if (config.file !== false) {
            prefix = `${line.file} ${prefix}`;
          }
          return `${prefix}: ${line.text}`;
        });
      }
    }
  }

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
   *   .$read({ mode: 'binary' }) // Read as a series of buffers
   *   .$reduce((acc, buffer) => {
   *     return acc  + buffer.length;
   *   }, 0); // Count number of bytes in file
   *
   * @example
   * '<file>'
   *   .$read({ mode:'binary', singleValue: true }) // Read as a single buffer
   *   .$map(buffer => buffer.length) // Count number of bytes in file
   */
  $read(this: AsyncIterable<string>, config?: Omit<ReadStreamConfig, 'mode'>): $AsyncIterable<string>
  $read(this: AsyncIterable<string>, config: ReadStreamConfig<'text'>): $AsyncIterable<string>
  $read(this: AsyncIterable<string>, config: ReadStreamConfig<'binary'>): $AsyncIterable<Buffer>;
  $read(this: AsyncIterable<string>, config: ReadStreamConfig<'raw'>): $AsyncIterable<fs.ReadStream>;
  async * $read(this: AsyncIterable<string>, config: ReadStreamConfig<IOType> = {}): $AsyncIterable<string | Buffer | fs.ReadStream> {
    for await (const file of this) {
      yield* StreamUtil.readStream(file, config);
    }
  }

  /**
   * `dir` provides the ability to recursively search for files within a file system.  It expects as the
   * input sequence type:
   * * A `string` which represents a a file extension (e.g. `.csv`). Will match all files recursively.
   * * A `string` which represents a glob pattern search on file names (e.g. `**\/*.csv`).
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
    config.type = config.type || 'file';

    for await (const pattern of this) {
      const testFile = FileUtil.getFileMatcher(pattern);
      yield* FileUtil.scanDir({
        testFile: config.type !== 'dir' ? testFile : undefined,
      }, config as ReadDirConfig & { base: string, type: string })
        .$filter(x => config.type === 'file' || testFile(x.relative))
        .$map(x => config.full ? x : x.file);
    }
  }
}
