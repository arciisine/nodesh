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
}