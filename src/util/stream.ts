import * as readline from 'readline';
import * as fs from 'fs';
import { Readable, Writable } from 'stream';

import { IOType, $AsyncIterable, ReadStreamConfig } from '../types';
import { TimeUtil } from './time';
import { AsyncUtil } from './async';
import { TextUtil } from './text';

class MemoryStream extends Writable {
  store: Buffer[] = [];

  _write(chunk: Buffer, enc: string, cb: Function) {
    this.store.push(chunk);
    cb();
  }

  getText() {
    return this.store.map(x => x.toString('utf8')).join('');
  }
}


export class StreamUtil {

  /**
   * Produces a writable stream that writes to memory
   */
  static memoryWritable() {
    return new MemoryStream();
  }

  /**
   * Convert sequence to stream. If the input stream are buffers, send directly.
   * Otherwise, send as text as lines.
   */
  static toStream(gen: AsyncIterable<any>, mode?: IOType): Readable {
    const readable = Readable.from((async function* () {
      for await (const value of gen) {
        if (value === undefined) {
          continue;
        }
        if (value instanceof Buffer) {
          if (!mode || mode === 'binary') {
            yield value;
          } else {
            yield value.toString('utf8');
          }
        } else {
          const text = TextUtil.toText(value);
          if (!mode || mode === 'text') {
            yield text;
          } else {
            yield Buffer.from(text, 'utf8');
          }
        }
      }
    })());

    return readable;
  }

  /**
   * Convert read stream into a sequence
   */
  static readStream(input: Readable | string, config?: Omit<ReadStreamConfig, 'mode'>): $AsyncIterable<string>;
  static readStream(input: Readable | string, config: ReadStreamConfig<'text'>): $AsyncIterable<string>;
  static readStream(input: Readable | string, config: ReadStreamConfig<'binary'>): $AsyncIterable<Buffer>;
  static readStream<T extends Readable>(input: T | string, config: ReadStreamConfig<'raw'>): T;
  static readStream(input: Readable | string, config: ReadStreamConfig<IOType> = {}): $AsyncIterable<string | Buffer> | Readable {
    const mode = config.mode ?? 'text';

    if (mode === 'raw') {
      return input as Readable;
    }

    const strm = typeof input === 'string' ? fs.createReadStream(input, { encoding: 'utf8' }) : input;
    const src = mode === 'text' ? readline.createInterface(strm) : strm;

    const completed = this.trackStream(strm);

    let done = false;
    let buffer: (string | Buffer)[] = [];

    src.on('close', () => done = true);

    if (mode === 'text') {
      src.on('line', v => {
        const line = typeof v === 'string' ? v : v.toString('utf8');
        buffer.push(`${line}\n`); // Retain newline
      });
    } else {
      src.on('data', v => {
        buffer.push(typeof v === 'string' ? Buffer.from(v, 'utf8') : v);
      });
    }

    return (async function* () {
      while (!done) {
        await TimeUtil.sleep(50);

        if (!config.singleValue && buffer.length) {
          yield* (buffer as any);
          buffer = [];
        }
      }

      // Set buffer to single value
      if (config.singleValue) {
        buffer = mode === 'text' ?
          [(buffer as string[]).join('')] :
          [Buffer.concat((buffer as Buffer[]))];
      }

      if (buffer.length) {
        yield* (buffer as any);
      }

      if (!strm.destroyed) {
        strm.destroy();
      }

      await completed;
    })();
  }

  /**
   * Track a stream to wait until finished
   */
  static trackStream<T extends Readable | Writable>(stream: T) {
    return AsyncUtil.trackWithTimer(new Promise((res, rej) => {
      if ('writable' in stream) {
        stream.on('finish', res);
      } else {
        stream.on('end', res);
      }
      stream.on('close', res);
      stream.on('error', rej);
    }));
  }

  /**
   * Get writable stream
   * @param writable
   */
  static getWritable(writable: Writable | string) {
    const stream = typeof writable !== 'string' && 'write' in writable ? writable :
      fs.createWriteStream(writable, { flags: 'w', autoClose: true });

    this.trackStream(stream);
    return stream;
  }
}