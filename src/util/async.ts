export class AsyncUtil {

  /**
   * Track promise until finished, prevent process termination
   * @param p
   */
  static trackWithTimer(cb: Promise<any>) {
    const timer = setTimeout(() => { }, 10 ** 8) as NodeJS.Timeout;
    cb.finally(() => timer.unref());
  }
}