import { AsyncUtil } from './async';

export class RegisterUtil {

  /**
   * Track a promise, prevent process termination until promise is resolved
   * @param p
   */
  static trackPromise<T>(p: Promise<T>): Promise<T> {
    const timer = setTimeout(() => { }, 10 ** 8) as NodeJS.Timeout;
    return p.finally(() => timer.unref());
  }

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
              fn(RegisterUtil.trackPromise((this as AsyncIterable<any>).$values));
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
        return RegisterUtil.trackPromise(ret);
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