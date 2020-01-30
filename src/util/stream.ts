import * as readline from 'readline';
import * as fs from 'fs';
import { Readable, Writable } from 'stream';

import { IOType, $AsyncIterable, ReadStreamConfig, CompletableStream } from '../types';
import { AsyncUtil } from './async';
import { TextUtil } from './text';

class MemoryStream extends Writable {
  store: Buffer[] = [];

  _write(chunk: Buffer, enc: string, cb: Function) {
    this.store.push(chunk);
    cb();
  }

  getText() {
    return Buffer.concat(this.store).toString('utf8');
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
          yield;
          continue;
        }
        if (value instanceof Buffer) {
          if (!mode || mode === 'binary') {
            yield value;
          } else {
            yield TextUtil.toLine(value);
          }
        } else {
          if (!mode || mode === 'text') {
            yield TextUtil.toLine(value);
          } else {
            yield Buffer.from(TextUtil.toText(value), 'utf8');
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
  static readStream<T extends Readable>(input: T | string, config: ReadStreamConfig<'raw'>): $AsyncIterable<CompletableStream<T>>;
  static async * readStream(input: Readable | string, config: ReadStreamConfig<IOType> = {}): $AsyncIterable<string | Buffer | CompletableStream> {
    const mode = config.mode ?? 'text';
    const stream = typeof input === 'string' ? fs.createReadStream(input, { encoding: mode === 'text' ? 'utf8' : undefined }) : input;
    const completed = this.trackStream(stream);

    if (mode === 'raw') {
      yield { stream, completed };
      return;
    }

    const src = mode === 'text' ? readline.createInterface(stream) : stream;

    let done = false;
    let buffer: (string | Buffer)[] = [];
    let waiter: ReturnType<typeof AsyncUtil['resolvablePromise']>;

    const tick = async (val?: any) => {
      if (typeof val === 'string' || val instanceof Buffer) {
        buffer.push(val);
      }
      waiter?.resolve(null);
    };

    // Listen for any closing
    src.on('end', () => tick(done = true));
    src.on('close', () => tick(done = true));
    src.on('error', (err) => waiter!.reject(err));

    if (mode === 'text') {
      src.on('line', v => tick(TextUtil.toText(v)));
    } else {
      src.on('data', v => tick(typeof v === 'string' ? Buffer.from(v, 'utf8') : v));
    }

    while (!done) {
      await (waiter = AsyncUtil.resolvablePromise());

      if (!config.singleValue && buffer.length) {
        yield* (buffer as any);
        buffer = [];
      }
    }

    // Set buffer to single value
    if (config.singleValue) {
      buffer = mode === 'text' ?
        [(buffer as string[]).join('\n')] :
        [Buffer.concat((buffer as Buffer[]))];
    }

    if (buffer.length) {
      yield* (buffer as any);
    }

    if (!stream.destroyed) {
      stream.destroy();
    }

    await completed;
  }

  /**
   * Track a stream to wait until finished
   */
  static trackStream<T extends Readable | Writable>(stream: T, withTimer = true) {
    const completed = new Promise((res, rej) => {
      stream.on('finish', res);
      stream.on('end', res);
      stream.on('close', res);
      stream.on('error', rej);
    });
    return withTimer ? AsyncUtil.trackWithTimer(completed) : completed;
  }

  /**
   * Get writable stream
   * @param writable
   */
  static getWritable(writable: Writable | string) {
    return typeof writable !== 'string' && 'write' in writable ? writable :
      fs.createWriteStream(writable, { flags: 'w', autoClose: true });
  }
}
