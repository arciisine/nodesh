import { Util } from '../util/util';

type Replacer = (first: string, ...args: any[]) => string;

type MatchMode = 'extract' | 'negate';

const REGEX_SUPPORT = {
  URL: /https?:\/\/[\/A-Za-z0-9:=?\-&.%]+/g,
  EMAIL: /[A-Za-z0-9_]+@[A-Za-z0-9_.]+[.][A-Za-z]+/g
};

type RegexType = keyof typeof REGEX_SUPPORT;

/**
 * Support for common textual operations.  
 * 
 * As text operators, these only apply to sequences that 
 * produce string values. 
 */
export class TextOperators {
  /**
   * `columns` is similar to the unix `awk` in that it allows for production of 
   * columns from a single line of text. This is useful for dealing with column 
   * oriented output.  The separator defaults to all whitespace but can tailored 
   * as needed by regex or string.
   * 
   * @example
   * '<file>.tsv' // Tab-separated file
   *   .async
   *   .read() // Read as lines
   *   .columns('\t') // Separate on tabs
   *   // Now an array of tuples (as defined by tabs in the tsv)
   */
  columns(this: AsyncGenerator<string>, sep?: RegExp | string): AsyncGenerator<string[]>;
  /**
   * Supports passing in column names to produce objects instead of tuples.  These values will be
   * matched with the columns produced by the separator. Any row that is shorter than the names
   * array will have undefined for the associated keys.
   * 
   * @example
   * '<file>.tsv' // Tab-separated file
   *   .async
   *   .read() // Read as lines
   *   .columns(['Name', 'Age', 'Major'], '\t') // Separate on tabs
   *   // Now an array of objects { Name: string, Age: string, Major: string } (as defined by tabs in the tsv)
   */
  columns<V extends readonly string[]>(this: AsyncGenerator<string>, names: V, sep?: RegExp | string): AsyncGenerator<Record<V[number], string>>
  async * columns(this: AsyncGenerator<string>, columnsOrSep?: RegExp | string | string[], sep?: RegExp | string) {
    let columns: string[] | undefined;

    if (Array.isArray(columnsOrSep)) {
      columns = columnsOrSep;
    } else {
      sep = columnsOrSep;
    }

    sep = sep ?? /\s+/g;

    for await (const line of this) {
      const row = line.split(sep);
      if (columns !== undefined) {
        const upper = Math.min(row.length, columns.length);
        const out: any = {};
        for (let i = 0; i < upper; i++) {
          out[columns![i]] = row[i];
        }
        yield out;
      } else {
        yield row;
      }
    }
  }
  /**
   * This operator allows for producing a single sequence of tokens out of lines of text.  The default separator is whitespace.
   * 
   * @example
   * 
   * '<file>'
   *   .async
   *   .read() // Read file as lines
   *   .tokens() // Convert to words 
   *   .filter(x => x.length > 5) // Retain only words 6-chars or longer
   */
  async * tokens(this: AsyncGenerator<string>, sep: RegExp | string = /\s+/g): AsyncGenerator<string, any, any> {
    for await (const line of this) {
      yield* line.split(sep);
    }
  }
  /**
   * `match` is similar to tokens, but will emit based on a pattern instead of 
   * just word boundaries.  
   * 
   * In addition to simple regex or string patterns, there is built in support for some common use cases (`RegexType`)
   * * `'URL'` - Will match on all URLs
   * * `'EMAIL'` - Will match on all emails
   * 
   * Additionally, mode will determine what is emitted when a match is found (within a single line):
   * * `undefined` - (default) Return entire line
   * * `'extract'` - Return only matched element
   * * `'negate'` - Return only lines that do not match 
   * 
   * @example
   * '<file>'
   *   .async
   *   .read()
   *   .match(/(FIXME|TODO)/, 'negate')  
   *   // Exclude all lines that include FIXME or TODO
   * 
   * @example
   * '<file>'
   *   .async
   *   .read()
   *   .match(/\d{3}(-)?\d{3}(-)?\d{4}/, 'extract)  
   *   // Return all phone numbers in the sequence
   */
  async * match(this: AsyncGenerator<string>, regex: RegExp | string | RegexType, mode?: MatchMode): AsyncGenerator<string> {
    if (typeof regex === 'string') {
      regex = regex in REGEX_SUPPORT ? REGEX_SUPPORT[regex as RegexType] : new RegExp(regex);
    }
    if (!regex.global && mode === 'extract') {
      regex = new RegExp(regex.source, `${regex.flags}g`);
    }
    for await (const el of this) {
      if (mode === 'extract') {
        const out: string[] = [];
        el.replace(regex, x => out.push(x) ? '' : '');
        for (const sub of out) {
          yield sub;
        }
      } else if (mode === 'negate') {
        if (!regex.test(el)) {
          yield el;
        }
      } else if (regex.test(el)) {
        yield el;
      }
    }
  }
  /**
   * `replace` behaves identically to `String.prototype.replace`, but will only operate 
   * on a single sequence value at a time.
   * 
   * @example
   *  '<file>'
   *   .async
   *   .read()
   *   .replace(/TODO/, 'FIXME')
   *   // All occurrences replaced
   */
  replace(this: AsyncGenerator<string>, pattern: RegExp | string, sub: string | Replacer): AsyncGenerator<string> {
    return this.map((x: string) => x.replace(pattern, sub as any));
  }
  /**
   * `trim` behaves identically to `String.prototype.trim`, but will only operate on a single sequence value at a time
   * 
   * @example
   * '<file>'
   *   .async
   *   .read()
   *   .trim() 
   *   // Cleans leading/trailing whitespace per line
   */
  trim(this: AsyncGenerator<string>): AsyncGenerator<string> {
    return this.map(x => x.trim());
  }
  /**
   * `singleLine` is a convenience method for converting an entire block of 
   * text into a single line.  This is useful when looking for patterns that 
   * may span multiple lines.
   * 
   * @example
   * '<file>.html'
   *   .async
   *   .read()
   *   .singleLine() // Convert to a single line
   *   .replace(/<[^>]+?>/) // Remove all HTML tags
   */
  singleLine(this: AsyncGenerator<string>): AsyncGenerator<string> {
    return this.join(' ').replace(/\n/g, ' ');
  }
  /**
   * This operator allows for combining a sequence of strings into a single value similar to `String.prototype.join`.
   * 
   * @example
   * '<file>'
   *   .async
   *   .read() // Read as a series of lines
   *   .join('\n') 
   *   // Produces a single value of the entire file
   */
  join(this: AsyncGenerator<string>, joiner?: string | ((a: string[]) => string)): AsyncGenerator<string> {
    if (!joiner) {
      joiner = (x: string[]) => x.join('');
    } else if (typeof joiner === 'string') {
      const val = joiner;
      joiner = (x: string[]) => x.join(val);
    }
    return this.collect().map(joiner);
  }
}
