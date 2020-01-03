import * as readline from 'readline';
import * as fs from 'fs';
import { Readable, Writable } from 'stream';

import { EventEmitter } from 'events';
import { IOType, $AsyncIterable } from '../types';
import { TimeUtil } from './time';
import { AsyncUtil } from './async';

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
   * Gets the textual representation of a value
   */
  static toText(val: any) {
    if (val === undefined || val === null) {
      return '';
    }
    return typeof val === 'string' ? val : JSON.stringify(val);
  }

  /**
   * Convert sequence to stream. If the input stream are buffers, send directly.
   * Otherwise, send as text, and if mode is line, append with newline.
   */
  static toStream(gen: AsyncIterable<any>, mode: IOType = 'line'): Readable {
    const readable = Readable.from((async function* () {
      for await (const value of gen) {
        if (value === undefined) {
          continue;
        } else if (value instanceof Buffer) {
          yield value;
        } else {
          const text = StreamUtil.toText(value);
          yield mode === 'line' ? `${text}\n` : text;
        }
      }
    })());

    return readable;
  }

  /**
   * Convert read stream into a sequence
   */
  static readStream(file: Readable | string, mode: 'binary'): $AsyncIterable<Buffer>;
  static readStream(file: Readable | string, mode: 'line' | 'text'): $AsyncIterable<string>;
  static readStream(file: Readable | string, mode?: IOType): $AsyncIterable<string>;
  static async * readStream(file: Readable | string, mode: IOType = 'line'): $AsyncIterable<Buffer | string> {
    const strm = typeof file === 'string' ? fs.createReadStream(file, { encoding: 'utf8' }) : file;
    const src: EventEmitter = mode === 'line' ? readline.createInterface(strm) : strm;
    const destroyed = new Promise(r => strm.once('close', r));

    AsyncUtil.trackWithTimer(destroyed);

    let done = false;
    let buffer: (string | Buffer)[] = [];

    src.on('close', () => done = true);

    if (mode === 'line') {
      src.on('line', v => {
        buffer.push(typeof v === 'string' ? v : v.toString('utf8'));
      });
    } else {
      src.on('data', v => {
        buffer.push(typeof v === 'string' ? Buffer.from(v, 'utf8') : v);
      });
    }

    while (!done) {
      await TimeUtil.sleep(50);

      if (buffer.length && mode !== 'text') {
        yield* (buffer as any);
        buffer = [];
      }
    }
    if (buffer.length) {
      if (mode === 'text') {
        yield Buffer.concat(buffer as Buffer[]).toString('utf-8');
      } else {
        yield* (buffer as any);
      }
    }
    if (!strm.destroyed) {
      strm.destroy();
    }

    await destroyed;
  }

  /**
   * Get writable stream
   * @param writable
   */
  static getWritable(writable: Writable | string) {
    const stream = typeof writable !== 'string' && 'write' in writable ? writable :
      fs.createWriteStream(writable, { flags: 'w', autoClose: true });

    const finished = new Promise(r => {
      stream.on('close', r);
      stream.on('finish', r);
    });

    AsyncUtil.trackWithTimer(finished);

    return stream;
  }
}