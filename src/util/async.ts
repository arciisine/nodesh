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
}