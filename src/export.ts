import * as fs from 'fs';
import { Readable, Writable } from 'stream';
import { IOType, StreamUtil } from './util/stream';
import { RegisterUtil } from './util/register';
import { OrStr } from './util/types';

declare global {
  interface AsyncGenerator<T> {
    /**
     * Converts a sequence into a node stream.  This readable stream should be
     * considered standard, and usable in any place a stream is expected. The mode
     * determines if the stream is string or `Buffer` oriented.
     */
    stream(this: AsyncGenerator<T>, mode?: IOType): Readable;
    /**
     * Emits the sequence contents to a write stream.  If the write stream is a string, it
     * is considered to be a file name. Buffer contents are written as is.  String contents
     * are written as lines.
     */
    write<U extends string | Buffer | any>(this: AsyncGenerator<U>, writable: OrStr<Writable>): Promise<void>;
    /**
     * Writes the entire stream to a file, as a final step. The write stream will not be created until all the values
     * have been emitted.  This is useful for reading and writing the same file.
     */
    writeFinal(this: AsyncGenerator<string>, file: string): Promise<void>;
    /**
     * Extract all sequence contents into a single array and return
     * as a promise
     */
    values: Promise<T[]>;
    /**
     * Extract first sequence element and return as a promise
     */
    value: Promise<T>;
    /**
     * Simple property that allows any sequence to be automatically written to stdout
     */
    stdout: void;
    /**
     * Simple property that allows any sequence to be automatically called with `console.log`
     */
    console: void;
  }
}

RegisterUtil.operators<any>({
  write(this: AsyncGenerator, writable: OrStr<Writable>) {
    return this.stream().pipe(StreamUtil.getWritable(writable));
  },
  async writeFinal(this: AsyncGenerator<string>, file: string) {
    const text = await this.join().value;
    const str = fs.createWriteStream(file);
    await new Promise(r => str.write(text, r));
    str.close();
  },
  stream(this: AsyncGenerator, mode: IOType = 'text') {
    return StreamUtil.toStream(this, mode);
  }
});

RegisterUtil.properties({
  stdout(this: AsyncGenerator<any>) {
    return this.stream('line').pipe(process.stdout);
  },
  console(this: AsyncGenerator<any>) {
    return this.forEach(console.log);
  },
  async values(this: AsyncGenerator<any>) {
    return this.collect().value;
  },
  async value(this: AsyncGenerator<any>) {
    const out = (await this.next()).value;
    RegisterUtil.kill(this);
    return out;
  }
});