import { $AsyncIterable, Pattern } from '../types';
import { TextUtil } from '../util/text';

type Replacer = Parameters<string['replace']>[1];
type ColumnsConfig<V extends readonly string[]> = { sep?: Pattern, names: V };
type MatchConfig = { negate: true } | { before?: number, after?: number };

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
   * This operator allows for producing a single sequence of tokens out of lines of text.  The default token is all sequences of non-whitespace.
   *
   * @example
   * '<file>'
   *   .$read() // Read file as lines
   *   .$tokens(/\b[A-Za-z]{6,100}\b/i) // Extract 6+ letter words
   *
   * @example
   * '<file>'
   *   .$read() // Read file as lines
   *   .$tokens($pattern.URL) // Extract all URLs
   */
  async * $tokens(this: AsyncIterable<string>, token: Pattern = /\S+/): $AsyncIterable<string> {
    token = TextUtil.createRegExp(token, 'g');
    for await (const line of this) {
      const matches: string[] = [];
      line.replace(token, m => matches.push(m) ? '' : '');
      yield* matches;
    }
  }

  /**
   * `$match` provides the ability to easily retain or exclude lines.
   *
   * Additionally, the config provides standard functionality, commensurate with grep:
   * * `negate` - Return only lines that do not match
   * * `before` - The number of lines to return before a match
   * * `after` - The number of lines to return after a match
   *
   * @example
   * '<file>'
   *   .$read()
   *   .$match('TODO')
   *   // All lines  with TODO in them
   *
   * @example
   * '<file>'
   *   .$read()
   *   .$match(/(FIXME|TODO)/, { negate:true })
   *   // Exclude all lines that include FIXME or TODO
   *
   * @example
   * '<file>'
   *   .$read()
   *   .$match(/\d{3}(-)?\d{3}(-)?\d{4}/, { after:1, before:1 })
   *   // Match all lines with phone numbers
   */
  async * $match(this: AsyncIterable<string>, pattern: Pattern, config: MatchConfig = {}): $AsyncIterable<string> {
    const regex = TextUtil.createRegExp(pattern, '');
    const negate = 'negate' in config ? config.negate : false;
    const before = ('before' in config ? config.before : 0) ?? 0;
    const after = ('after' in config ? config.after : 0) ?? 0;

    if (negate) {
      for await (const el of this) {
        if (!regex.test(el)) {
          yield el;
        }
      }
    } else {
      let lastN = [];
      let counter = 0;

      for await (const el of this) {
        if (regex.test(el)) {
          if (before && lastN.length) {
            yield* lastN;
            lastN = [];
          }
          yield el;
          if (after) {
            counter = after;
          }
        } else if (counter) {
          yield el;
          counter -= 1;
        } else if (before) {
          lastN.push(el);
          if (lastN.length > before) {
            lastN.shift();
          }
        }
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
   * `$toString` is a convenience method for converting an entire block of
   * text into a single string.  This is useful when looking for patterns that
   * may span multiple lines.
   *
   * @example
   * '<file>.html'
   *   .$read()
   *   .$toString() // Convert to a single string
   *   .$replace(/<[^>]+?>/) // Remove all HTML tags
   */
  $toString(this: AsyncIterable<string>): $AsyncIterable<string> {
    return this.$collect().$map(x => x.join(''));
  }
}