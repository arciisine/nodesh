
export class Util {
  /**
   * Gets the textual representation of a value
   */
  static toText(val: any) {
    if (val === undefined || val === null) {
      return '';
    }
    return typeof val === 'string' ? val : JSON.stringify(val);
  }

  /**
   * Sleep for a specified amount of time
   */
  static sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
}