import { OrProm, Gen, Reducer } from '../types';


/**
 * The core functionality provides some very basic support for sequences
 */
export class CoreOperators {
  /**
   * This operator is a terminal action that receives each element of the sequence in sequence,
   * but returns no value.  This function produces a promise that should be waited on to ensure the
   * sequence is exhausted.
   * @param fn
   *
   * @example 
   * fs.createReadStream('<file>')
   *   .async //  Now a line-oriented sequence
   *   .forEach(console.log)  // Will output each line
   */
  async forEach<T>(this: AsyncGenerator<T>, fn: (x: T) => OrProm<any>) {
    for await (const item of this) {
      await fn(item);
    }
  }
  /**
   * Converts the sequence of data into another, by applying an operation
   * on each element.
   * @param fn
   * 
   * @example 
   * fs.createReadStream('<file>')
   *  .async //  Now a line-oriented sequence
   *  .map(line => line.toUpperCase()) 
   *  // is now a sequence of all uppercase lines
   */
  async * map<T, U>(this: AsyncGenerator<T>, fn: (x: T) => OrProm<U>) {
    for await (const item of this) {
      yield (await fn(item));
    }
  }
  /**
   * Determines if items in the sequence are valid or not. Invalid items
   * are discarded, while valid items are retained.
   * @param pred
   * 
   * @example
   * fs.createReadStream('<file>')
   *   .async //  Now a line-oriented sequence
   *   .filter(x => x.length > 10) 
   *   // Will retain all lines that are more than 10 characters
   */
  async * filter<T>(this: AsyncGenerator<T>, pred: (x: T) => OrProm<boolean>) {
    for await (const item of this) {
      if (await pred(item)) {
        yield item;
      }
    }
  }
  /**
   * Flattens a sequence of arrays, or a sequence of sequences.  This allows for operators that
   * return arrays/sequences, to be able to be represented as a single sequence.
   * @param this
   * 
   * @example
   * fs.createReadStream('<file>')
   *   .async //  Now a line-oriented sequence
   *   .map(line => line.split(/\s+/g)) // Now a string[] sequence
   *   .flatten() // Now a string sequence for each word in the file
   */
  async * flatten<T, U>(this: AsyncGenerator<U[]> | AsyncGenerator<AsyncGenerator<U>>): AsyncGenerator<U> {
    for await (const item of this) {
      yield* (item as AsyncGenerator<U>);
    }
  }
  /**
   * This is a combination of `map` and `flatten` as they are common enough in usage to warrant a
   * combined operator.  This will map the the contents of the sequence (which produces an array
   * or sequence), and producing a flattened output.
   * @param fn
   * 
   * @example
   * fs.createReadStream('<file>')
   *   .async //  Now a line-oriented sequence
   *   .flatMap(line => line.split(/\s+/g)) // Now a word sequence for the file
   */
  async * flatMap<T, U>(this: AsyncGenerator<T>, fn: (x: T) => Gen<U> | { async: AsyncGenerator<U> }): AsyncGenerator<U> {
    for await (const el of this) {
      const val = await fn(el);
      const res = ((val.hasOwnProperty('async') && 'async' in val) ? val.async : val) as AsyncGenerator<U>;
      yield* res;
    }
  }
  /**
   * This is the standard reduce operator and behaves similarly as `Array.prototype.reduce`.  This operator
   * takes in an accumulation function, which allows for computing a single value based on visiting each element
   * in the sequence.  Given that reduce is a comprehensive and produces a singular value, this operation cannot
   * stream and will block until the stream is exhausted. Normally it is common to understand `map` and `filter` as
   * being implemented by `reduce`, but in this situation they behave differently.
   * @param fn
   * @param acc
   * 
   * @example
   * fs.createReadStream('<file>')
   *   .async //  Now a line-oriented sequence  
   *   .flatMap(line => line.split(/\s+/g)) // Now a string sequence for each word in the file
   *   .reduce((acc, token) => {
   *     acc[token] = (acc[token] ?? 0) + 1;
   *     return acc;
   *   }, {}); // Produces a map of words and their respective frequencies within the document
   */
  async * reduce<T, U>(this: AsyncGenerator<T>, fn: Reducer<U, T> & { init?: () => U }, acc?: U): AsyncGenerator<U> {
    if (acc === undefined) {
      acc = fn.init!();
    }
    for await (const item of this) {
      acc = await fn(acc, item);
    }
    yield acc;
  }

  /**
   * Gathers the entire sequence output as a single array.  This is useful if you need the entire stream to perform an action.
   * 
   * @example
   * fs.createReadStream('<file>')
   *   .async //  Now a line-oriented sequence  
   *   .collect() // Now a sequence with a single array (of all the lines)
   *   .map(lines => lines.join('\n'))
   *   // Produces a single string of the whole file
   */
  collect<T>(this: AsyncGenerator<T>): AsyncGenerator<T[]> {
    return this.reduce((acc, el) => {
      acc.push(el);
      return acc;
    }, [] as T[]);
  }
  /**
   * This is the simplest mechanism for extending the framework as the operator takes in a function that operates on the sequence of
   * data as a whole.  It will consume the sequence and produce an entirely new sequence.
   * 
   * @example
   * async function translate*(lang, gen) {
   *   for await (const line of gen) {
   *     for (const word of line.split(/\s+/g)) {
   *       const translated = await doTranslate(lang, word);
   *       yield translated;
   *     }
   *   }
   * }
   * 
   * fs.createReadStream('<file>')
   *   .async //  Now a line-oriented sequence  
   *   .wrap(translate.bind(null, 'fr')); // Produces a sequence of french-translated word
   */
  async * wrap<T, U>(this: AsyncGenerator<T>, fn: (input: AsyncGenerator<T>) => AsyncGenerator<U>) {
    yield* fn(this);
  }
  /**
   * If an error occurs, use the provided sequence instead
   */
  async * onError<T>(this: AsyncGenerator<T>, alt: AsyncGenerator<T> | (() => AsyncGenerator<T>)) {
    try {
      yield* this;
    } catch (err) {
      yield* ('apply' in alt ? alt() : alt);
    }
  }
}
