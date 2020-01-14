export class AsyncUtil {

  /**
   * Track promise until finished, prevent process termination
   * @param p
   */
  static trackWithTimer(prom: Promise<any>) {
    const timer = setTimeout(() => { }, 10 ** 8) as NodeJS.Timeout;
    prom.finally(() => {
      timer.unref();
    });
    return prom;
  }

  /**
   * Combine promises into single, waiting on aux
   */
  static combine<T>(primary: Promise<T>, ...aux: Promise<any>[]) {
    return Promise.all([primary, ...aux]).then(x => primary);
  }

  /**
   * Makes a manually resolvable promise
   */
  static resolvablePromise<T = void>(): Promise<T> & { resolve: (v: T) => void, reject: (err: Error) => void } {
    let ops;
    const prom = new Promise((resolve, reject) => ops = { resolve, reject });
    Object.assign((prom as any), ops);
    return prom as any;
  }
}