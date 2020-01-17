import { Readable } from 'stream';

export function patch() {
  // Patch Readable.from
  if (!('from' in Readable)) {
    (Readable as any)['from'] = function (gen: AsyncIterable<any>) {
      const itr = gen[Symbol.asyncIterator]();
      const readable = new Readable();
      readable._read = async function () {
        const { done, value } = await itr.next();
        if (done) {
          this.push(null);
        } else {
          this.push(value);
        }
      };
      return readable;
    };
  }

  // Patch globalThis
  try {
    (globalThis as any)['test'];
  } catch {
    (global as any)['globalThis'] = global;
  }
}

patch();