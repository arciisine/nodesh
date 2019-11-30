import { Util } from './util';

export const PARENT = Symbol('PARENT');

export class RegisterUtil {

  static properties(
    props: PropertyDescriptorMap
  ) {
    Object.defineProperties(Util.asyncGen.prototype, props);
  }

  /**
   * Registers global async operators
   */
  static operators<T = AsyncGenerator<any>>(
    props: Record<string, (this: AsyncGenerator<any>, ...args: any[]) => T>
  ) {
    for (const key of Object.keys(props)) {
      (Util.asyncGen.prototype as any)[key] = function (...args: any[]) {
        const ret = props[key].call(this, ...args);
        (ret as any)[PARENT] = this; // Track heritage
        return ret;
      };
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
    this.getParent(gen).return(null);
  }
}