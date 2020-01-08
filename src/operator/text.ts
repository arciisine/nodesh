import { $AsyncIterable, Pattern } from '../types';
import { TextUtil } from '../util/text';

type Replacer = Parameters<string['replace']>[1];
type ColumnsConfig<V extends readonly string[]> = { sep?: Pattern, names: V };

function isIter<T>(x: any): x is Iterable<T> {
  return !!x[Symbol.iterator];
}

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
  $columns(this: AsyncIterable<string>, sep?: string | RegExp): $AsyncIterable<string[]>;
  /**
   * Supports passing in column names to produce objects instead of tuples.  These values will be
   * matched with the columns produced by the separator. Any row that is shorter than the names
   * array will have undefined for the associated keys.
   *
   * @example
   * '<file>.tsv' // Tab-separated file
   *   .$read() // Read as lines
   *   .$columns({names: ['Name', 'Age', 'Major'], sep: '\t'}) // Separate on tabs
   *   // Now an array of objects { Name: string, Age: string, Major: string } (as defined by tabs in the tsv)
   */
  $columns<V extends readonly string[]>(this: AsyncIterable<string>, config: V | ColumnsConfig<V>): $AsyncIterable<Record<V[number], string>>
  async * $columns(this: AsyncIterable<string>, sepOrConfig?: string | RegExp | string[] | ColumnsConfig<string[]>) {
    let config: ColumnsConfig<string[]>;

    if (!sepOrConfig || typeof sepOrConfig === 'string' || sepOrConfig instanceof RegExp) {
      config = { sep: sepOrConfig } as ColumnsConfig<string[]>;
    } else {
      config = Array.isArray(sepOrConfig) ? { names: sepOrConfig } : sepOrConfig as ColumnsConfig<string[]>;
    }

    const sep = TextUtil.createRegExp(config.sep ?? /\s+/, '');

    for await (const line of this) {
      const row = line.split(sep);
      const { names } = config;
      if (names) {
        const upper = Math.min(row.length, names.length);
        const out: any = {};
        for (let i = 0; i < upper; i++) {
          out[names![i]] = row[i];
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
  async * $tokens(this: AsyncIterable<string>, sep: Pattern = /\s+/): $AsyncIterable<string> {
    sep = TextUtil.createRegExp(sep, '');
    for await (const line of this) {
      yield* line.split(sep);
    }
  }

  /**
   * `$match` is similar to tokens, but will emit based on a pattern instead of
   * just word boundaries.
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
  async * $match(this: AsyncIterable<string>, regex: Pattern, mode?: 'extract' | 'negate'): $AsyncIterable<string> {
    regex = TextUtil.createRegExp(regex, mode === 'extract' ? 'g' : '');

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
  $replace(this: AsyncIterable<string>, pattern: Pattern, sub: string | Replacer): $AsyncIterable<string>;

  /**
   * `$replace` also supports a mode where you can pass in a series of tokens, and replacements, and will apply all
   * consistently. The largest token will win if there is any overlap.
   *
   * @example
   *  '<file>.html'
   *   .$read()
   *   .$replace({
   *      '<': '&lt;',
   *      '>': '&gt;',
   *      '"': '&quot;'
   *   })
   *   // Html special chars escaped
   */
  $replace(this: AsyncIterable<string>, pattern: Record<string, string>): $AsyncIterable<string>;
  $replace(this: AsyncIterable<string>, pattern: Pattern | Record<string, string>, sub?: string | Replacer): $AsyncIterable<string> {
    if (typeof pattern === 'string' || pattern instanceof RegExp || isIter<string>(pattern)) {
      const re = TextUtil.createRegExp(pattern, 'g');
      return this.$map(x => x.replace(re, sub as any));
    } else {
      const re = TextUtil.createRegExp(Object.keys(pattern));
      return this.$map(x => x.replace(re, v => pattern[v]));
    }
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