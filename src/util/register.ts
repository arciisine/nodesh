import * as stream from 'stream';

import { StreamUtil } from './stream';
import { OrGen, AsyncGeneratorCons } from '../types';

async function* ofOne<T>(e: T) {
  yield e;
}

const PARENT = Symbol('PARENT');

export class RegisterUtil {

  /**
   * Produce an async generator from any value
   */
  static of<T>(val: AsyncGenerator<T>): AsyncGenerator<T>; // eslint-disable-line
  static of<T>(val: AsyncIterable<T>): AsyncGenerator<T>; // eslint-disable-line
  static of<T>(val: Iterable<T>): AsyncGenerator<T>; // eslint-disable-line
  static of<T>(val: T): AsyncGenerator<T>; // eslint-disable-line
  static of<T extends object>(val: OrGen<T>): AsyncGenerator<T> {
    if (val === null || val === undefined || typeof val === 'string') {
      return ofOne(val);
    } else if (val.constructor === AsyncGeneratorCons) {
      return val as AsyncGenerator<T>;
    } else if (val instanceof stream.Readable) {
      return StreamUtil.readStream(val) as AsyncGenerator<any>;
    } else if ((val as any)[Symbol.iterator] || (val as any)[Symbol.asyncIterator]) {
      return (async function* () {
        yield* (val as any);
      })();
    } else {
      return ofOne(val) as AsyncGenerator<T>;
    }
  }

  /**
   * Register new type as asyncable
   * @param t 
   */
  static registerAsyncable(t: Function) {
    RegisterUtil.properties({
      async(this: any) {
        return RegisterUtil.of(this);
      }
    }, t.prototype)
  }

  /**
   * Register type as thenable
   */
  static registerThenable(t: Function) {
    RegisterUtil.properties({
      then: {
        get() {
          return (fn: Function) => {
            Promise.resolve().then(() => {
              fn((this as any).values);
            });

            return this;
          };
        }
      }
    }, t.prototype);
  }

  static properties(
    props: PropertyDescriptorMap | Record<string, Function>,
    proto: Record<string, any>
  ) {
    for (const key of Object.keys(props)) {
      try {
        let val = props[key];
        if ('apply' in val) {
          val = { get: val } as any;
        }
        Object.defineProperty(proto, key, val);
      } catch (err) {
        // Do nothing
      }
    }
  }

  /**
   * Registers global async operators
   */
  static registerOperators(
    cons: Function[],
    target: Record<string, any>
  ) {
    for (const { name, prototype } of cons) {
      if (!name) {
        continue;
      }
      for (const key of Object.getOwnPropertyNames(prototype)) {
        if (key === 'constructor') {
          continue;
        }
        let prop = Object.getOwnPropertyDescriptor(prototype, key)!;
        if (prop.get) {
          Object.defineProperty(target.prototype, key, prop);
        } else {
          (target.prototype as any)[key] = function (...args: any[]) {
            const ret = prototype[key].call(this, ...args);
            (ret as any)[PARENT] = this; // Track heritage
            return ret;
          };
        }
      }
    }
  }

  /**
   * Get parent of sequence
   */
  static getParent<T>(gen: AsyncGenerator<T>) {
    while ((gen as any)[PARENT]) {
      gen = (gen as any)[PARENT] as AsyncGenerator<T>;
    }
    return gen;
  }

  /**
   * Terminate sequence by targeting parent
   */
  static kill(gen: AsyncGenerator) {
    RegisterUtil.getParent(gen).return(null);
  }
}