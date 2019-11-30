import * as path from 'path';

import { StreamUtil, IOType } from './util/stream';
import { FileUtil, ScanEntry } from './util/file';
import { RegisterUtil } from './util/register';

type DirConfig = { base?: string, full?: boolean };

declare global {
  interface AsyncGenerator<T = unknown, TReturn = any, TNext = unknown> {
    /**
     * This operator will treat the inbound string sequence as file names, and will convert the filename (based on IOType)
     * * `line` (default) - The sequence will produce as series of lines of text
     * * `text` - The sequence will produce the entire file contents as a single text string
     * * `binary` - The sequence will produce a series of `Buffer` objects
     */
    read(this: AsyncGenerator<string, TReturn, TNext>, type: 'binary'): AsyncGenerator<Buffer, TReturn, TNext>;
    read(this: AsyncGenerator<string, TReturn, TNext>, type?: IOType): AsyncGenerator<string, TReturn, TNext>;
    /**
     * `dir` provides the ability to recursively search for files within a file system.  It expects as the
     * input sequence type as a string or Regex.
     */
    dir(this: AsyncGenerator<string | RegExp, TReturn, TNext>, config: Omit<DirConfig, 'full'> & { full: true }): AsyncGenerator<ScanEntry, TReturn, TNext>;
    dir(this: AsyncGenerator<string | RegExp, TReturn, TNext>, config: DirConfig): AsyncGenerator<string, TReturn, TNext>;
    dir(this: AsyncGenerator<string | RegExp, TReturn, TNext>): AsyncGenerator<string, TReturn, TNext>;
    dir(this: AsyncGenerator<string | RegExp, TReturn, TNext>, config?: DirConfig): AsyncGenerator<string | ScanEntry, TReturn, TNext>;
  }
}

RegisterUtil.operators({
  async * read(this: AsyncGenerator<string>, type: Exclude<IOType, 'binary'> = 'line') {
    for await (const file of this) {
      yield* StreamUtil.readStream(file, type);
    }
  },
  async * dir(config: DirConfig = { base: process.cwd() }) {
    config.base = path.resolve(process.cwd(), config.base! || ''); // relative to working directory, but pull path

    for await (const pattern of this) {
      const testFile =
        typeof pattern === 'string' ?
          (x: string) => x.endsWith(pattern) :
          (x: string) => pattern.test(x);

      yield* FileUtil.scanDir({ testFile }, config.base!).map(x => config.full ? x : x.file);
    }
  }
});
