import * as readline from 'readline';

import { Readable, Writable } from 'stream';

/**
 * Support for dealing with specific data formats as inputs
 */
export class DataOperators {
  /**
   * Converts the inbound JSON string into JS Object by way of `JSON.parse`.  This will
   * operate on individual values in the sequence, so each value should be a
   * complete document.
   * 
   * @example
   * `https://jsonplaceholder.typicode.com/todos/1`
   *   .async
   *   .fetch() // request url
   *   .json()  // Convert from JSON
   */
  json<V = any>(this: AsyncGenerator<string>): AsyncGenerator<V> {
    return this.map(x => JSON.parse(x));
  }
  /**
   * Converts the inbound CSV string into JS Object.  Converts by using simple CSV support and
   * splitting on commas.  Each value in the sequence is assumed to be a single row in the output.
   * 
   * @example
   * '<file>.csv'
   *   .async
   *   .read() // Read file
   *   .csv(['Name', 'Age', 'Major']) 
   *   // Convert to objects from CSV
   */
  csv<V extends readonly string[]>(this: AsyncGenerator<string>, columns: V
  ): AsyncGenerator<Record<V[number], string>> {
    return this.columns(columns, /,/);
  }
  /**
   * Will read string values from the input, delimited by new lines
   * 
   * @example
   * 'Enter a file name:'
   *   .async
   *   .prompt() // Request file name
   *   .read() // Read file
   */
  async * prompt(this: AsyncGenerator<string>, input: Readable = process.stdin, output: Writable = process.stdout): AsyncGenerator<string> {
    let intf: readline.Interface;
    try {
      intf = readline.createInterface({ input, output });

      for await (const message of this) {
        yield await new Promise(res =>
          intf.question(`${message}\n`, res));
      }
    } finally {
      intf!.close();
    }
  }
}