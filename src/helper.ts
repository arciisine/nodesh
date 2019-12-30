import { RegisterUtil } from './util/register';
import { AsyncGeneratorCons } from './types';

/**
 * Within the framework there are some common enough patterns that 
 * exposing them globally proves useful.  
 */
export class GlobalHelpers {
  /**
   * Will turn any value into a sequence. If the input value is of type:
   * * `Iterable` - Returns sequence of elements
   * * `AsyncIterable` - Returns sequence of elements
   * * `AsyncGenerator` - Returns sequence of elements
   * * `Readable`/`ReadStream` - Returns a sequence of lines read from stream
   * * Everything else - Returns a sequence of a single element
   * 
   * @example
   * of([1,2,3])
   *    .map(x => x ** 2)
   *  
   *  // Should be identical
   *  
   *  [1,2,3].async
   *    .map(x => x ** 2)  
   */
  get of() {
    return RegisterUtil.of;
  }

  /**
   * In the process of using the tool, there may be a need for encapsulating common 
   * operations.  By default, `wrap` provides an easy path for re-using functionality,
   * but it lacks the clarity of intent enjoyed by the built in operators.
   * 
   * @example (reverse.js)
   * class Custom {
   *   reverse() {
   *     return this
   *       .collect() // Gather the entire sequence as an array
   *       .map(x => x.reverse()) // Reverse it 
   *       .flatten(); // Flatten it back into a single sequence
   *   }
   * }
   * 
   * registerOperator(Custom);
   * 
   * module global { // Typescript only
   *   interface AsyncGenerator<T = unknown, TReturn = any, TNext = unknown> extends Custom;
   * }
   * 
   * @example
   * require('./reverse')
   * 
   * [1,2,3]
   *   .async
   *   .reverse() // Reverse is now available
   */
  get registerOperator() {
    return (op: Function) => RegisterUtil.registerOperators(
      [op], AsyncGeneratorCons
    );
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
   * (argv[0] ?? 'Enter a file name:'.prompt()) 
   *   // Pull in name from argv[0] or prompt if missing
   *   .async
   *   .read() // Read file
   */
  get argv(): string[] {
    return process.argv.slice(3);
  }
  /**
   * Provides direct access to stdin as sequence of lines
   * 
   * @example
   * stdin // Stream stdin, one line at a time
   *  .map(line => line.split('').reverse().join('')) // Reverse each line
   *  .stdout // Pipe to stdout
   */
  get stdin(): AsyncGenerator<string> {
    return process.stdin.async;
  }
  /**
   * A case insensitive map for accessing environment variables. Like `process.env`, but 
   * doesn't require knowledge of the case.  Useful for simplifying script interactions.
   * 
   * @example
   * (env.user_name ?? ask('Enter a user name')) // Prompt user name if there
   *   .async // Can call async on sequences and it will return the same value
   *   .map(userName => ... ) 
   */
  get env(): Record<string, string> {
    return new Proxy({}, {
      get(obj, key: string) {
        return process.env[key] ??
          process.env[key.toUpperCase()] ??
          process.env[key.toLowerCase()];
      }
    })
  }
  /**
   * Produces a numeric range, between start (1 by default) and stop (inclusive).  A step
   * parameter can be defined to specify the distance between iterated numbers.
   * 
   * @example
   * range(1, 3)
   *   .map(x => x**2) 
   *   // sequence of 1, 4, 9
   * 
   * range(10, 1, 2)
   *   // sequence of 1, 3, 5, 7, 9
   */
  async * range(stop: number, start = 1, step = 1) {
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