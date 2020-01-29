import { CSVConfig } from '../types';

/* eslint-disable @typescript-eslint/ban-types */
export class DataUtil {

  /**
   * Parse line as CSV
   */
  static parseCSVLine(line: string, config: CSVConfig): string[];
  static parseCSVLine(line: string, config: CSVConfig, columns: string[]): Record<string, string>;
  static parseCSVLine(line: string, config: CSVConfig, columns?: string[]): Record<string, string> | string[] {
    const out: string[] = [];
    let codes: number[] = [];
    let pos = 0;
    const sepCh = config.sep.charCodeAt(0);
    const quoteCh = config.quote.charCodeAt(0);
    const escapeCh = '\\'.charCodeAt(0);
    let inQuote = false;
    const end = line.length;

    while (pos >= 0 && pos < end) {
      const ch = line.charCodeAt(pos);
      const peek = line.charCodeAt(pos + 1);
      if (ch === escapeCh) {
        pos += 1; // Skip
        codes.push(peek);
      } else if (!inQuote && ch === sepCh) {
        out.push(String.fromCharCode(...codes));
        codes = [];
      } else if (inQuote && ch === quoteCh) {
        if (peek === quoteCh) {
          pos += 1; // Skip
          codes.push(peek);
        } else {
          inQuote = false;
        }
      } else if (ch === quoteCh) {
        inQuote = true;
      } else {
        codes.push(ch);
      }
      pos += 1;
    }

    // Last code
    out.push(String.fromCharCode(...codes));

    if (columns) {
      const obj: Record<string, string> = {};
      const upper = Math.min(columns.length, out.length);
      for (let i = 0; i < upper; i++) {
        obj[columns[i]] = out[i];
      }
      return obj;
    } else {
      return out;
    }
  }

  /**
   * Convert string to type
   */
  static coerce(type: Date, val: any): Date;
  static coerce(type: Number, val: any): number;
  static coerce(type: String, val: any): string
  static coerce(type: Boolean, val: any): boolean;
  static coerce(type: null, val: any): null;
  static coerce(type: any, val: any): Date | number | string | boolean | null {
    const text = typeof val === 'string' ? val : `${val}`;
    switch (type) {
      case Number: return text.includes('.') ? parseFloat(text) : parseInt(text, 10);
      case Boolean: return /(1|yes|true|on)/i.test(text);
      case Date: return new Date(text);
      case null: return null;
      case String:
      default: return text;
    }
  }
}