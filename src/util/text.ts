import { Pattern } from '../types';

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
  static createRegExp(values: Pattern, flags: string = 'g') {
    if (!(values instanceof RegExp)) {
      const keys = (
        typeof values === 'string' ?
          [values] : [...values]
      )
        .filter(x => x !== null && x !== undefined)
        .sort((a, b) => b.length - a.length || a.localeCompare(b));
      return new RegExp(`(${[...keys].map(v => this.escapeRegExp(v)).join('|')})`, flags);
    } else {
      const all = flags + values.flags;
      const finalFlags = ['g', 's', 'm', 'i'].filter(x => all.includes(x)).join('');
      return new RegExp(values.source, finalFlags);
    }
  }

  /**
   * Gets the textual representation of a value
   */
  static toText(val: any): string {
    if (val === undefined || val === null) {
      return '';
    } else if (val instanceof Buffer) {
      return val.toString('utf8');
    } else if (typeof val !== 'string') {
      return JSON.stringify(val);
    }
    return val;
  }

  static toLine(val: any) {
    val = this.toText(val);
    return val.endsWith('\n') ? val : `${val}\n`;
  }
}