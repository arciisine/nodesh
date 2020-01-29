import { AsyncUtil } from './async';

export class RegisterUtil {

  /**
   * Register new type as async iterable
   * @param t
   */
  static registerAsyncable(t: Function) {
    const $iterable =
      function (this: any) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return this?.[Symbol.asyncIterator] ? this :
          this?.[Symbol.iterator] ?
            (async function* () { yield* self; })() :
            (async function* () { yield self; })();
      };
    RegisterUtil.properties({ $iterable }, t.prototype);
  }

  /**
   * Register type as thenable
   */
  static registerThenable(t: Function) {
    RegisterUtil.properties({
      then: {
        get<T>(this: AsyncIterable<T>) {
          const p = this.$values;
          return p.then.bind(p);
        }
      }
    }, t.prototype);
  }

  static defineProperty(obj: any, key: string | symbol, desc: PropertyDescriptor) {
    Object.defineProperty(obj, key, { ...desc, configurable: true });
  }

  /**
   * Define properties on prototype
   */
  static properties(
    props: PropertyDescriptorMap | Record<string, Function>,
    proto: Record<string, any>
  ) {
    for (const key of Object.keys(props)) {
      let val = props[key];
      if ('apply' in val) {
        val = { get: val } as any;
      }
      this.defineProperty(proto, key, val as PropertyDescriptor);
    }
  }

  static createOperator<T = any>(target: (...args: any[]) => AsyncIterator<T>) {
    return function (this: AsyncIterable<T>, ...args: any[]) {
      const ret = target.call(this.$iterable, ...args);
      if (ret instanceof Promise) {
        AsyncUtil.trackWithTimer(ret);
      }
      return ret;
    };
  }

  /**
   * Registers global async operators
   */
  static registerOperators(cons: Function | Function[], target: Record<string, any> = Object) {
    if (!Array.isArray(cons)) {
      cons = [cons];
    }
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
        this.defineProperty(target.prototype, key, prop);
      }
    }
  }
}