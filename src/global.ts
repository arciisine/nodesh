/// <reference path="./global-patch.d.ts" />

import { GlobalUtil } from './util/global';

declare global {
  namespace globalThis {
    /**
     * Provides direct access to stdin as sequence of lines
     */
    const stdin: AsyncGenerator<string>;
    /**
     * Allows for simple prompting as a sequence of lines
     */
    const ask: (message: string) => AsyncGenerator<string>;
    /**
     * The cleaned argv parameters for the running script. Starting at index 0, is the
     * first meaning parameter for the script.
     */
    const argv: string[];
    /**
     * A case insensitive map for accessing environment variables
     */
    const env: Record<string, string>;
    /**
     * Will turn any value into a sequence
     */
    const of: <T>(x: T | Iterable<T> | AsyncIterable<T>) => AsyncGenerator<T>;
  }
}

Object.assign(globalThis, {
  argv: process.argv.slice(3),
  ask(message: string) {
    return message
      .async
      .repeat()
      .prompt()
      .filter(x => {
        if (x.trim()) {
          return x;
        } else {
          console.log('Please enter a value');
        }
      });
  },
  stdin: process.stdin.async,
  of: GlobalUtil.of,
  env: new Proxy({}, {
    get(obj, key: string) {
      return process.env[key] ??
        process.env[key.toUpperCase()] ??
        process.env[key.toLowerCase()];
    }
  })
});