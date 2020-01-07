/**
 * Common utilities for dealing with text
 */
export class TextUtil {

  /**
   * Escape regexp special chars
   */
  static escapeRegExp(value: string) {
    return value.replace(/[*?+()\[\]{}|]/g, x => `\\${x}`);
  }

  /**
   * Create an alternating regexp from a list of values
   */
  static createRegExp(values: Iterable<string> | string) {
    const keys = (
      typeof values === 'string' ?
        [values] : [...values]
    )
      .filter(x => x !== null && x !== undefined)
      .sort((a, b) => b.length - a.length || a.localeCompare(b));
    return new RegExp(`(${[...keys].map(v => this.escapeRegExp(v)).join('|')})`, 'g');
  }

  /**
   * Gets the textual representation of a value
   */
  static toText(val: any) {
    if (val === undefined || val === null) {
      return '';
    }
    return typeof val === 'string' ? val : JSON.stringify(val);
  }
}