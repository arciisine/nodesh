import { RegisterUtil } from './util/register';

type Replacer = (first: string, ...args: any[]) => string;

type MatchMode = 'extract' | 'negate';

const REGEX_SUPPORT = {
  URL: /https?:\/\/[\/A-Za-z0-9:=?\-&.%]+/g,
  EMAIL: /[A-Za-z0-9_]+@[A-Za-z0-9_.]+[.][A-Za-z]+/g
};

type RegexType = keyof typeof REGEX_SUPPORT;

declare global {
  interface AsyncGenerator<T> {
    /**
     * Supports passing in column names to produce objects instead of tuples.  These values will be
     * matched with the columns produced by the separator. Any row that is shorter than the names
     * array will have undefined for the associated keys.
     */
    columns<V extends readonly string[]>(
      this: AsyncGenerator<string>, names: V, sep?: RegExp | string
    ): AsyncGenerator<Record<V[number], string>>;
    /**
     * Similar to the unix `awk` in that it allows for production of columns from a single line of
     * text. This is useful for dealing with column oriented output.  The separator defaults to all
     * whitespace but can tailored as needed by regex or string.
     */
    columns(this: AsyncGenerator<string>, sep?: RegExp | string): AsyncGenerator<T[]>;
    /**
     * This operator allows for producing a single sequence of tokens out of lines of text.  The default separator is whitespace.
     */
    tokens(this: AsyncGenerator<string>, sep?: RegExp | string): AsyncGenerator<T>;
    /**
     * Similar to `tokens`, but will emit based on a pattern instead of just word boundaries.  In addition to simple regex or
     * string patterns, there is built in support for some common use cases like URLs and Emails addresses. Additionally, mode
     * will determine what is emitted when a match is found (within a single line).
     */
    match(this: AsyncGenerator<string>, regex: RegExp | string | RegexType, mode?: MatchMode): AsyncGenerator<string>;
    /**
     * Behaves identically to `String.prototype.replace`, but will only operate on a single generator value at a time.
     */
    replace(this: AsyncGenerator<string>, regex: RegExp | string, sub: string | Replacer): AsyncGenerator<string>;
    /**
     * Behaves identically to `String.prototype.trim`, but will only operate on a single generator value at a time.
     */
    trim(this: AsyncGenerator<string>): AsyncGenerator<string>;
    /**
     * Convenience method for converting an entire block of text into a single line.  This is useful when looking for
     * patterns that may span multiple lines.
     */
    singleLine(this: AsyncGenerator<string>): AsyncGenerator<string>;
    /**
     * This operator allows for combining a sequence of strings into a single value similar to `String.prototype.join`.
     */
    join(this: AsyncGenerator<string>, joiner?: string | ((a: string[]) => string)): AsyncGenerator<string>;
  }
}

RegisterUtil.operators({
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
  },
  async * tokens(sep: RegExp | string = /\s+/g) {
    for await (const line of this) {
      yield* line.split(sep);
    }
  },
  replace(this: AsyncGenerator<string>, pattern: RegExp | string, sub: string | Replacer) {
    return this.map((x: string) => x.replace(pattern, sub as any));
  },
  trim(this: AsyncGenerator<string>) {
    return this.map(x => x.trim());
  },
  singleLine(this: AsyncGenerator<string>) {
    return this.join(' ').replace(/\n/g, ' ');
  },
  async * match(this: AsyncGenerator<string>, regex: RegExp | RegexType | string, mode?: MatchMode) {
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
        yield* out;
      } else if (mode === 'negate') {
        if (mode === 'negate' && !regex.test(el)) {
          yield el;
        }
      } else if (regex.test(el)) {
        yield el;
      }
    }
  },
  join(joiner?: (x: string[]) => string) {
    if (!joiner) {
      joiner = (x: string[]) => x.join('');
    } else if (typeof joiner === 'string') {
      const val = joiner;
      joiner = (x: string[]) => x.join(val);
    }
    return this.collect().map(joiner);
  }
});