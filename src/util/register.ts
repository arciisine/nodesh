import { AsyncUtil } from './async';

export class RegisterUtil {

  /**
   * Register new type as async iterable
   * @param t
   */
  static registerAsyncable(t: Function) {
    RegisterUtil.properties({
      $iter(this: any) {
        return AsyncUtil.toIterable(this);
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
              const ret = (this as AsyncIterable<any>).$values;
              AsyncUtil.trackWithTimer(ret);
              fn(ret);
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
      let val = props[key];
      if ('apply' in val) {
        val = { get: val } as any;
      }
      (val as any).configurable = true;
      Object.defineProperty(proto, key, val);
    }
  }

  static createOperator<T = any>(target: (...args: any[]) => AsyncIterator<T>) {
    return function (this: AsyncIterable<T>, ...args: any[]) {
      const src = this.$iter ?? this;

      const ret = target.call(src, ...args);
      if (ret instanceof Promise) {
        return AsyncUtil.trackWithTimer(ret);
      } else {
        return ret;
      }
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
}