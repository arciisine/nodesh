import * as readline from 'readline';

import { RegisterUtil } from './util/register';

declare global {
  interface AsyncGenerator<T = unknown, TReturn = any, TNext = unknown> {
    /**
     * Converts the inbound JSON string into JS Object by way of `JSON.parse`.  This will
     * operate on individual values in the sequence, so each value should be a
     * complete document.
     */
    json<V = any>(this: AsyncGenerator<string, TReturn, TNext>): AsyncGenerator<V, TReturn, TNext>;
    /**
     * Converts the inbound CSV string into JS Object.  Converts by using simple CSV support and
     * splitting on commas.  Each value in the sequence is assumed to be a single row in the output.
     */
    csv<V extends readonly string[]>(
      this: AsyncGenerator<string, TReturn, TNext>, columns: V
    ): AsyncGenerator<Record<V[number], string>, TReturn, TNext>;
    /**
     * Will read string values from the input, delimited by new lines
     */
    prompt<V = any>(this: AsyncGenerator<string, TReturn, TNext>): AsyncGenerator<V, TReturn, TNext>;
  }
}

RegisterUtil.operators({
  json(this: AsyncGenerator<string>) {
    return this.map(x => JSON.parse(x));
  },
  csv<T extends readonly string[]>(this: AsyncGenerator<string>, columns: T) {
    return this.columns(columns, /,/);
  },
  async * prompt(this: AsyncGenerator<string>) {
    let intf: readline.Interface;
    try {
      intf = readline.createInterface({ input: process.stdin, output: process.stdout });

      for await (const message of this) {
        yield await new Promise(res =>
          intf.question(`${message}\n`, res));
      }
    } finally {
      intf!.close();
    }
  }
});