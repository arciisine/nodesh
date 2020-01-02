import { $AsyncIterable } from '../types';

type Replacer = Parameters<string['replace']>[1];

export type MatchMode = 'extract' | 'negate';

const REGEX_SUPPORT = {
  URL: /https?:\/\/[\/A-Za-z0-9:=?\-&.%]+/g,
  EMAIL: /[A-Za-z0-9_]+@[A-Za-z0-9_.]+[.][A-Za-z]+/g
};

/**
 * Support for common textual operations.
 *
 * As text operators, these only apply to sequences that
 * produce string values.
 */
export class TextOperators {
  /**
   * `$columns` is similar to the unix `awk` in that it allows for production of
   * columns from a single line of text. This is useful for dealing with column
   * oriented output.  The separator defaults to all whitespace but can tailored
   * as needed by regex or string.
   *
   * @example
   * '<file>.tsv' // Tab-separated file
   *   .$read() // Read as lines
   *   .$columns('\t') // Separate on tabs
   *   // Now an array of tuples (as defined by tabs in the tsv)
   */
  $columns(this: AsyncIterable<string>, sep?: RegExp | string): $AsyncIterable<string[]>;
  /**
   * Supports passing in column names to produce objects instead of tuples.  These values will be
   * matched with the columns produced by the separator. Any row that is shorter than the names
   * array will have undefined for the associated keys.
   *
   * @example
   * '<file>.tsv' // Tab-separated file
   *   .$read() // Read as lines
   *   .$columns(['Name', 'Age', 'Major'], '\t') // Separate on tabs
   *   // Now an array of objects { Name: string, Age: string, Major: string } (as defined by tabs in the tsv)
   */
  $columns<V extends readonly string[]>(this: AsyncIterable<string>, names: V, sep?: RegExp | string): $AsyncIterable<Record<V[number], string>>
  async * $columns(this: AsyncIterable<string>, columnsOrSep?: RegExp | string | string[], sep?: RegExp | string) {
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
   *   .$read() // Read file as lines
   *   .$tokens() // Convert to words
   *   .$filter(x => x.length > 5) // Retain only words 6-chars or longer
   */
  async * $tokens(this: AsyncIterable<string>, sep: RegExp | string = /\s+/g): $AsyncIterable<string> {
    for await (const line of this) {
      yield* line.split(sep);
    }
  }

  /**
   * `$match` is similar to tokens, but will emit based on a pattern instead of
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
   *   .$read()
   *   .$match(/(FIXME|TODO)/, 'negate')
   *   // Exclude all lines that include FIXME or TODO
   *
   * @example
   * '<file>'
   *   .$read()
   *   .$match(/\d{3}(-)?\d{3}(-)?\d{4}/, 'extract)
   *   // Return all phone numbers in the sequence
   */
  async * $match(this: AsyncIterable<string>, regex: RegExp | string, mode?: MatchMode): $AsyncIterable<string> {
    if (typeof regex === 'string') {
      regex = regex in REGEX_SUPPORT ? REGEX_SUPPORT[regex as 'URL'] : new RegExp(regex);
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
   * `$replace` behaves identically to `String.prototype.replace`, but will only operate
   * on a single sequence value at a time.
   *
   * @example
   *  '<file>'
   *   .$read()
   *   .$replace(/TODO/, 'FIXME')
   *   // All occurrences replaced
   */
  $replace(this: AsyncIterable<string>, pattern: RegExp | string, sub: string | Replacer): $AsyncIterable<string> {
    return this.$map((x: string) => x.replace(pattern, sub as any));
  }

  /**
   * `$trim` behaves identically to `String.prototype.trim`, but will only operate on a single sequence value at a time
   *
   * @example
   * '<file>'
   *   .$read()
   *   .$trim()
   *   // Cleans leading/trailing whitespace per line
   */
  $trim(this: AsyncIterable<string>): $AsyncIterable<string> {
    return this.$map(x => x.trim());
  }

  /**
   * This operator allows for combining a sequence of strings into a single value similar to `String.prototype.join`.
   *
   * @example
   * '<file>'
   *   .$read() // Read as a series of lines
   *   .$join('\n')
   *   // Produces a single value of the entire file
   */
  $join(this: AsyncIterable<string>, joiner?: string | ((a: string[]) => string)): $AsyncIterable<string> {
    if (!joiner) {
      joiner = (x: string[]) => x.join('');
    } else if (typeof joiner === 'string') {
      const val = joiner;
      joiner = (x: string[]) => x.join(val);
    }
    return this.$collect().$map(joiner);
  }

  /**
   * `$singleLine` is a convenience method for converting an entire block of
   * text into a single line.  This is useful when looking for patterns that
   * may span multiple lines.
   *
   * @example
   * '<file>.html'
   *   .$read()
   *   .$singleLine() // Convert to a single line
   *   .$replace(/<[^>]+?>/) // Remove all HTML tags
   */
  $singleLine(this: AsyncIterable<string>): $AsyncIterable<string> {
    return this.$join(' ').$replace(/\n/g, ' ');
  }
}

