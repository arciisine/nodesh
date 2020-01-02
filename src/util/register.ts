import { AsyncUtil } from './async';
import { PARENT } from '../types';

export class RegisterUtil {

  /**
   * Register new type as asyncable
   * @param t
   */
  static registerAsyncable(t: Function) {
    RegisterUtil.properties({
      $(this: any) {
        return AsyncUtil.toGenerator(this);
      }
    }, t.prototype);
  }

  /**
   * Register type as thenable
   */
  static registerThenable(t: Function) {
    RegisterUtil.properties({
      then: {
        get() {
          return (fn: (data: Promise<any[]>) => void) => {
            Promise.resolve().then(() => {
              fn((this as AsyncGenerator).values);
            });

            return this;
          };
        }
      }
    }, t.prototype);
  }

  /**
   * Define properties on prototype
   * @param props
   * @param proto
   */
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
        (val as any).configurable = true;
        Object.defineProperty(proto, key, val);
      } catch (err) {
        // Do nothing
      }
    }
  }

  static createOperator<T = any>(target: (...args: any[]) => AsyncGenerator<T>) {
    return function (this: AsyncGenerator<T>, ...args: any[]) {
      const ret = target.call(this, ...args);
      ret[PARENT] = this; // Track heritage
      return ret;
    };
  }

  /**
   * Registers global async operators
   */
  static registerOperators(cons: Function[], target: Record<string, any>) {
    for (const { name, prototype } of cons) {
      if (!name) {
        continue;
      }
      for (const key of Object.getOwnPropertyNames(prototype)) {
        if (key === 'constructor') {
          continue;
        }
        let prop = Object.getOwnPropertyDescriptor(prototype, key)!;
        if (!prop.get) {
          prop = {
            get() {
              return RegisterUtil.createOperator(prototype[key]);
            }
          };
        }
        prop.configurable = true;
        Object.defineProperty(target.prototype, key, prop);
      }
    }
  }

  /**
   * Get parent of sequence
   */
  static getParent<T>(gen: AsyncGenerator<T>) {
    while (!!gen[PARENT]) {
      gen = gen[PARENT]!;
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