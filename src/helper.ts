import { Readable } from 'stream';
import { RegisterUtil } from './util/register';

/**
 * Within the framework there are some common enough patterns that
 * exposing them globally proves useful.
 */
export class GlobalHelpers {
  /**
   * Will turn any value into a sequence. If the input value is of type:
   * * `Iterable` - Returns sequence of elements
   * * `AsyncIterable` - Returns sequence of elements
   * * `Readable`/`ReadStream` - Returns a sequence of lines read from stream
   * * Everything else - Returns a sequence of a single element
   *
   * @example
   * $of([1,2,3])
   *    .$map(x => x ** 2)
   *
   *  // Should be identical
   *
   *  [1,2,3]
   *    .$map(x => x ** 2)
   */
  static $of(el: Readable): AsyncGenerator<string>;
  static $of(el: string): AsyncGenerator<string>;
  static $of<T>(el: AsyncIterable<T>): AsyncGenerator<T>;
  static $of<T>(el: Iterable<T>): AsyncGenerator<T>;
  static $of<T>(el: AsyncIterable<T>): AsyncGenerator<T>;
  static $of<T>(el: T[]): AsyncGenerator<T>;
  static $of<T>(el: T): AsyncGenerator<T> {
    return (el as any)?.$iterable ?? [el].$iterable;
  }

  /**
   * Top level access to execute a program
   *
   * @example
   * $exec('ls', ['-lsa'])
   *  .$columns(['blockSize', 'perms', 'size', 'group', 'owner', 'month', 'day', 'time', 'path'])
   *  .$console
   */
  static get $exec(): AsyncIterable<any>['$exec'] {
    const empty: any[] = [];
    return empty.$exec.bind(empty);
  }

  /**
   * In the process of using the tool, there may be a need for encapsulating common
   * operations.  By default, `$wrap` provides an easy path for re-using functionality,
   * but it lacks the clarity of intent enjoyed by the built in operators.
   *
   * @example
   * // @template T
   * class AsyncIterable {
   *   // @returns {AsyncIterable<T>}
   *   $reverse() {
   *     return this
   *       .$collect() // Gather the entire sequence as an array
   *       .$flatMap(x => x.reverse()); // Reverse it and flatten
   *   }
   * }
   *
   * $registerOperator(AsyncIterable);
   *
   * $stdin
   *  .$reverse()
   *  .$stdout;
   */
  static get $registerOperator(): (op: Function) => void {
    return RegisterUtil.registerOperators;
  }

  /**
   * The cleaned argv parameters for the running script. Starting at index 0,
   * is the first meaning parameter for the script.  This differs from `process.argv`
   * by excluding the executable and script name.  This is useful as the script may
   * be invoked in many different ways and the desire is to limit the amount of
   * guessing needed to handle inputs appropriately.
   *
   * NOTE: If you are going to use a command line parsing tool, then you would continue to
   * use `process.argv` as normal.
   *
   * @example
   * (argv[0] ?? 'Enter a file name:'.$prompt())
   *   // Pull in name from argv[0] or prompt if missing
   *   .$read() // Read file
   */
  static get $argv(): string[] {
    return process.argv.slice(3);
  }

  /**
   * Provides direct access to stdin as sequence of lines
   *
   * @example
   * $stdin // Stream stdin, one line at a time
   *  .$map(line => line.split('').reverse().join('')) // Reverse each line
   *  .$stdout // Pipe to stdout
   */
  static get $stdin(): AsyncIterable<string> {
    return process.stdin.$iterable;
  }

  /**
   * A case insensitive map for accessing environment variables. Like `process.env`, but
   * doesn't require knowledge of the case.  Useful for simplifying script interactions.
   *
   * @example
   * ($env.user_name ?? ask('Enter a user name')) // Prompt user name if there
   *   .$map(userName => ... )
   */
  static get $env(): Record<string, string> {
    return new Proxy({}, {
      get(obj, key: string) {
        return process.env[key] ??
          process.env[key.toUpperCase()] ??
          process.env[key.toLowerCase()];
      }
    });
  }

  /**
   * Common patterns that can be used where regular expressions are supported
   *
   * @example
   * <file>
   *  .$read() // Read a file
   *  .$tokens($pattern.URL) // Extract URLs
   *  .$filter(url => url.endsWith('.com'))
   */
  static get $pattern() {
    return {
      URL: /https?:\/\/[\/A-Za-z0-9:=?\-&.%]+/g,
      EMAIL: /[A-Za-z0-9_]+@[A-Za-z0-9_.]+[.][A-Za-z]+/g,
      PROPER_NAME: /\b[A-Z][a-z]+\b/g
    };
  }

  /**
   * Produces a numeric range, between start (1 by default) and stop (inclusive).  A step
   * parameter can be defined to specify the distance between iterated numbers.
   *
   * @example
   * $range(1, 3)
   *   .$map(x => x**2)
   *   // sequence of 1, 4, 9
   *
   * $range(10, 1, 2)
   *   // sequence of 1, 3, 5, 7, 9
   */
  static async * $range(stop: number, start = 1, step = 1): AsyncIterable<number> {
    if (step > 0 && stop < start) {
      const temp = start;
      start = stop;
      stop = temp;
    }
    for (let i = start; i <= stop; i += step) {
      yield i;
    }
  }
}