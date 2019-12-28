import { IOType, Writer, StreamUtil } from './util/stream';
import { RegisterUtil } from './util/register';

declare global {
  interface AsyncGenerator<T = unknown, TReturn = any, TNext = unknown> {
    /**
     * Converts a sequence into a node stream.  This readable stream should be
     * considered standard, and usable in any place a stream is expected. The mode
     * determines if the stream is string or `Buffer` oriented.
     */
    stream(this: AsyncGenerator<T>, mode?: IOType): NodeJS.ReadableStream;
    /**
     * Emits the sequence contents to a write stream.  If the write stream is a string, it
     * is considered to be a file name. Buffer contents are written as is.  String contents
     * are written as lines.
     */
    write<U extends string | Buffer | any>(this: AsyncGenerator<U, TReturn, TNext>, writable: Writer): Promise<void>;
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
  write(this: AsyncGenerator, writable: Writer) {
    return StreamUtil.write(this, writable);
  },
  stream(this: AsyncGenerator, mode: IOType = 'text') {
    return StreamUtil.toStream(this, mode);
  }
});

RegisterUtil.properties({
  stdout: {
    get(this: AsyncGenerator<any>) {
      return this.write(process.stdout);
    }
  },
  console: {
    get(this: AsyncGenerator<any>) {
      return this.tap(console.log).values;
    }
  },
  values: {
    async get(this: AsyncGenerator<any>) {
      const out = await this.collect();
      RegisterUtil.kill(this);
      return out;
    }
  },
  value: {
    async get(this: AsyncGenerator<any>) {
      const ret = (await this.next()).value;
      RegisterUtil.kill(this);
      return ret;
    }
  }
});