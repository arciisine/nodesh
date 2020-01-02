# Node Shell
Node shell is an npm package aimed at providing bash-like operations/simplicity within the node ecosystem.  The goal is to make working with files/folders, http requests, and transformations, as as easy as possible.  The library is built upon the async generation constructs within Ecmascript as well as stream constructs within the node ecosystem.  This means the performance is iterative and real-time, just in the same way piping works in a Unix shell.

**(remote-tokens.js) Example of processing URLs from the input stream** 

```javascript
#!/bin/npx @arcsine/nodesh

stdin // Automatically pipe from stdin
  .match('URL', 'extract')  // Retain only URL patterns and emit as single values
  .fetch() // Request each url that comes through
  .tokens(/[^A-Za-z0-9_]+/) // Break down returned webpage into tokens
  .trim() 
  .filter(x => 
    x.length >= 6 &&  // Retain words that are 6 chars or more
    x.charAt(0) === x.charAt(0).toUpperCase() // And that start with an uppercase letter
  )  
  .stdout; // Pipe the token stream to stdout

```

As you can see above, the library's aim is to mimic the pattern of command piping, as well as integrate with stdin/stdout seamlessly.  With the shebang applied appropriately, this script can be used just like any other cli command.  

**Example of integrating node scripts within the shell**
```bash
$ find . -name '*.ts' |\
    cat |\
    ./remote-tokens.js |\
    sort -u
```

## Table of Contents
* [Goals](#goals)
  + [Motivation](#motivation)
* [Architecture](#architecture)
  + [Sources](#sources)
* [Global Helpers](#global-helpers)
* [Operators](#operators)

## Goals
This tools is aimed at simple workflows that normally live within the domain of bash scripts.  It is meant to be an alternative of staying in bash or jumping over to another language like python.  It's aimed at being able to leverage node libraries and utilities while providing a solid set of foundational elements. 

The goal of this tool is not to be:
* a comprehensive streaming framework
* a reactive framework (e.g. rxjs)
* a build system alternative.  

This tool has aspects of all of the above, but it's primary design goal is to focus on providing simplicity in shell-like interaction.  To that end, design decisions were made towards simplicity over performance, and towards common patterns versus being completely configurable.  

### Motivation
When solving simple problems involving file systems, file contents, and even http requests, the Unix command line is a great place to operate.  The command line is a powerful tool with all of the built in functionality, and the simplicity of the Unix philosophy.  As bash scripts grow in complexity, maintenance and understanding tend to drop off quickly.  When piping a file through 5-10+ commands, following the logic can be challenging.  

Usually at this point, is when I would switch over to something like Python given it's "batteries included" mentality, as it's a perfectly fine language in it's own right.  That being said, I find it more and more desirable to be able to leverage common tools/libraries from the node ecosystem in these tasks.  

## Architecture
The tool revolves around the use of `async` generators, as denoted by `async function *`.  This allows for the iterative operation, as well as support for asynchronous operations.  This means everything within the framework is non-blocking.  This means the primary way of using the framework is by accessing your data as an async generator.  The library has built in support for converting basic data types into async generators, as well as built-in support for common patterns.

**Example of simple async generator**

```typescript
async function * asyncWorker() {
  while (true) {
    const result = await longOp();
    yield result;
  }
}
```

### Sources
Out of the box, the following types support an `.$` property that returns an async generator for the supported type.  Currently the supported types are:

#### Iterables
* Generator - This will return the generator, but as an async generator
* `Set` - This will return an async generator over the set contents
* `Map` - This will return an async generator over the map's entries [key, value]
* `NodeJS:ReadStream` - This will return a line-oriented async generator over the read stream

**Example of read stream**
```typescript
const lineGenerator = fs.createReadStream('data.txt').$;
```

#### Primitives
The following primitives also support `.$`, but will return a generator that only has 
a single value, that of the primitive
* `String`
* `Number`
* `RegExp`

In addition to the built-in functionality, a global function `of` is declared that will allow any value passed in to be converted to an async generator.  If the item is iterable or is a stream, it will return the iteration as a generator, otherwise return the value as a single-valued generator.

**Example of simple value**
```typescript
const bigIntGen = of(10000n);

...

const numberGen = (100000).$;
const numberGen2 = of(10000);

```


### GlobalHelpers

Within the framework there are some common enough patterns that
exposing them globally proves useful.



#### Of

Will turn any value into a sequence. If the input value is of type:
* `Iterable` - Returns sequence of elements
* `AsyncIterable` - Returns sequence of elements
* `AsyncGenerator` - Returns sequence of elements
* `Readable`/`ReadStream` - Returns a sequence of lines read from stream
* Everything else - Returns a sequence of a single element

```typescript
get of(): typeof AsyncUtil.of;
```
Example
```javascript
of([1,2,3])
   .map(x => x ** 2)

 // Should be identical

 [1,2,3].async
   .map(x => x ** 2)

```

#### RegisterOperator

In the process of using the tool, there may be a need for encapsulating common
operations.  By default, `wrap` provides an easy path for re-using functionality,
but it lacks the clarity of intent enjoyed by the built in operators.

```typescript
get registerOperator(): (op: Function) => void;
```
Example
```javascript
 (reverse.js)
class Custom {
  reverse() {
    return this
      .collect() // Gather the entire sequence as an array
      .map(x => x.reverse()) // Reverse it
      .flatten(); // Flatten it back into a single sequence
  }
}

registerOperator(Custom);

module global { // Typescript only
  interface AsyncGenerator<T = unknown, TReturn = any, TNext = unknown> extends Custom;
}

```

```javascript
require('./reverse')

[1,2,3]
  .async
  .reverse() // Reverse is now available

```

#### Argv

The cleaned argv parameters for the running script. Starting at index 0,
is the first meaning parameter for the script.  This differs from `process.argv`
by excluding the executable and script name.  This is useful as the script may
be invoked in many different ways and the desire is to limit the amount of
guessing needed to handle inputs appropriately.

NOTE: If you are going to use a command line parsing tool, then you would continue to
use `process.argv` as normal.

```typescript
get argv(): string[];
```
Example
```javascript
(argv[0] ?? 'Enter a file name:'.prompt())
  // Pull in name from argv[0] or prompt if missing
  .async
  .read() // Read file

```

#### Stdin

Provides direct access to stdin as sequence of lines

```typescript
get stdin(): AsyncGenerator<string>;
```
Example
```javascript
stdin // Stream stdin, one line at a time
 .map(line => line.split('').reverse().join('')) // Reverse each line
 .stdout // Pipe to stdout

```

#### Env

A case insensitive map for accessing environment variables. Like `process.env`, but
doesn't require knowledge of the case.  Useful for simplifying script interactions.

```typescript
get env(): Record<string, string>;
```
Example
```javascript
(env.user_name ?? ask('Enter a user name')) // Prompt user name if there
  .async // Can call async on sequences and it will return the same value
  .map(userName => ... )

```

#### Range

Produces a numeric range, between start (1 by default) and stop (inclusive).  A step
parameter can be defined to specify the distance between iterated numbers.

```typescript
range(stop: number, start?: number, step?: number): AsyncGenerator<number, void, unknown>;
```
Example
```javascript
range(1, 3)
  .map(x => x**2)
  // sequence of 1, 4, 9

range(10, 1, 2)
  // sequence of 1, 3, 5, 7, 9

```

## Operators
The entirety of this project centers on the set of available operators.  These operators can be broken into the following groups


### Core

The core functionality provides some very basic support for sequences



#### ForEach

This operator is a terminal action that receives each element of the sequence in sequence,
but returns no value.  This function produces a promise that should be waited on to ensure the
sequence is exhausted.
```typescript
forEach<T>(this: AsyncGenerator<T>, fn: PromFunc<T, any>): Promise<void>;
```
Example
```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .forEach(console.log)  // Will output each line

```

#### Map

Converts the sequence of data into another, by applying an operation
on each element.
```typescript
map<T, U>(this: AsyncGenerator<T>, fn: PromFunc<T, U>): AsyncGenerator<U, void, unknown>;
```
Example
```javascript
fs.createReadStream('<file>')
 .async //  Now a line-oriented sequence
 .map(line => line.toUpperCase())
 // is now a sequence of all uppercase lines

```

#### Filter

Determines if items in the sequence are valid or not. Invalid items
are discarded, while valid items are retained.
```typescript
filter<T>(this: AsyncGenerator<T>, pred: PromFunc<T, boolean>): AsyncGenerator<T, void, unknown>;
```
Example
```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .filter(x => x.length > 10)
  // Will retain all lines that are more than 10 characters

```

#### Flatten

Flattens a sequence of arrays, or a sequence of sequences.  This allows for operators that
return arrays/sequences, to be able to be represented as a single sequence.
```typescript
flatten<T, U>(this: AsyncGenerator<AsyncStream<U>>): AsyncGenerator<U>;
```
Example
```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .map(line => line.split(/\s+/g)) // Now a string[] sequence
  .flatten() // Now a string sequence for each word in the file

```

#### FlatMap

This is a combination of `map` and `flatten` as they are common enough in usage to warrant a
combined operator.  This will map the the contents of the sequence (which produces an array
or sequence), and producing a flattened output.
```typescript
flatMap<T, U>(this: AsyncGenerator<T>, fn: PromFunc<T, AsyncStream<U>>): AsyncGenerator<U, any, any>;
```
Example
```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .flatMap(line => line.split(/\s+/g)) // Now a word sequence for the file

```

#### Reduce

This is the standard reduce operator and behaves similarly as `Array.prototype.reduce`.  This operator
takes in an accumulation function, which allows for computing a single value based on visiting each element
in the sequence.  Given that reduce is a comprehensive and produces a singular value, this operation cannot
stream and will block until the stream is exhausted. Normally it is common to understand `map` and `filter` as
being implemented by `reduce`, but in this situation they behave differently.
```typescript
reduce<T, U>(this: AsyncGenerator<T>, fn: ((acc: U, item: T) => OrProm<U>) & {init?: () => U;}, acc?: U): AsyncGenerator<U>;
```
Example
```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .flatMap(line => line.split(/\s+/g)) // Now a string sequence for each word in the file
  .reduce((acc, token) => {
    acc[token] = (acc[token] ?? 0) + 1;
    return acc;
  }, {}); // Produces a map of words and their respective frequencies within the document

```

#### Collect

Gathers the entire sequence output as a single array.  This is useful if you need the entire stream to perform an action.

```typescript
collect<T>(this: AsyncGenerator<T>): AsyncGenerator<T[]>;
```
Example
```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .collect() // Now a sequence with a single array (of all the lines)
  .map(lines => lines.join('\n'))
  // Produces a single string of the whole file

```

#### Wrap

This is the simplest mechanism for extending the framework as the operator takes in a function that operates on the sequence of
data as a whole.  It will consume the sequence and produce an entirely new sequence.

```typescript
wrap<T, U>(this: AsyncGenerator<T>, fn: (input: AsyncGenerator<T>) => AsyncStream<U>): AsyncGenerator<U, void, undefined>;
```
Example
```javascript
async function translate*(lang, gen) {
  for await (const line of gen) {
    for (const word of line.split(/\s+/g)) {
      const translated = await doTranslate(lang, word);
      yield translated;
    }
  }
}

fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .wrap(translate.bind(null, 'fr')); // Produces a sequence of french-translated word

```

#### OnError

If an error occurs, use the provided sequence instead

```typescript
onError<T>(this: AsyncGenerator<T>, alt: OrCallable<AsyncStream<T>>): AsyncGenerator<T, void, undefined>;
```
Example
```javascript
'<file>'
 .async
 .read()
 .onError(() => `Sample Text`)

```

#### Parallel

Run iterator in parallel, returning values in order of first completion

```typescript
parallel<T>(this: AsyncGenerator<Promise<T>>): AsyncGenerator<T>;
```
Example
```javascript


```


### File

Some of the most common shell operations are iterating through files,
and operating upon those files.  To support this, the framework supports
producing files as a sequence of file objects or filenames, given a file
extension or a regex pattern. With `String`s and `RegExp`s supporting the
`.async` property, these are the most common way of finding files.



#### Read

This operator will treat the inbound string sequence as file names, and will convert the filename (based on IOType)
* `line` (default) - The sequence will produce as series of lines of text
* `text` - The sequence will produce the entire file contents as a single text string
* `binary` - The sequence will produce a series of `Buffer` objects

```typescript
read(this: AsyncGenerator<string>, type: 'binary'): AsyncGenerator<Buffer>;
read(this: AsyncGenerator<string>, type?: IOType): AsyncGenerator<string>;
read(this: AsyncGenerator<string>, type: 'line' | 'text'): AsyncGenerator<string>;
```
Example
```javascript
'<file>'
  .async //  Now a sequence of a single value, a file name
  .read('binary') // Read as a series of buffers
  .reduce((acc, buffer) => {
    return acc  + buffer.length;
  }, 0); // Count number of bytes in file

```

```javascript
'<file>'
  .async //  Now a sequence of a single value, a file name
  .read('text') // Read as a single string
  .map(text => text.length); // Count number of characters in file


```

#### Dir

`dir` provides the ability to recursively search for files within a file system.  It expects as the
input sequence type:
* A `string` which represents a suffix search on file names (e.g. `.csv`)
* A `RegExp` which represents a file pattern to search on (e.g. `/path\/sub\/.*[.]js/`)

In addition to the input sequence type, there is an optional config to affect the output.
By default the output of this sequence will be a series of file names, relative to the `process.cwd()`
that will be eligible for reading or any other file operation.

```typescript
dir(this: AsyncGenerator<string | RegExp>, config: Omit<DirConfig, 'full'> & {full: true;}): AsyncGenerator<ScanEntry>;
dir(this: AsyncGenerator<string | RegExp>, config: DirConfig): AsyncGenerator<string>;
dir(this: AsyncGenerator<string | RegExp>): AsyncGenerator<string>;
dir(this: AsyncGenerator<string | RegExp>, config?: DirConfig): AsyncGenerator<string | ScanEntry>;
```
Example
```javascript
'.csv'
  .async
  .dir({ full: true }) // List all '.csv' files, recursively
  .forEach(f => {
    // Display the filename, and it's modification time
    console.log(f.file, f.stats.mtime);
  });

```


### Transform

Standard operators regarding common patterns for transformations



#### NotEmpty

This is a special type of filter that excludes `null`, `undefined` and `''`.
Useful for removing empty values.

```typescript
notEmpty<T>(this: AsyncGenerator<T>): AsyncGenerator<T>;
```
Example
```javascript
'<file>'
  .async
  .read()
  .notEmpty() // Return all non-empty lines of the file

```

#### Tap

`tap` provides the ability to inspect the sequence without affecting it's production.  The function passed in
can produce a promise that will be waited on, if needed.

```typescript
tap<T>(this: AsyncGenerator<T>, visit?: PromFunc<T, any>): AsyncGenerator<T>;
```
Example
```javascript
'.csv'
  .async
  .dir()
  .tap(({stats}) => collectMetrics(stats))
  // Stream unchanged, but was able to track file stat information

```

#### Unique

`unique` will ensure the output sequence does not have any consecutive duplicates, similar to the unix `uniq` command.
The uniqueness is only guaranteed linearly, to allow for streaming.  Otherwise this would need to wait
for all data before proceeding.  You can also specify a custom equality function as needed.

```typescript
unique<T>(this: AsyncGenerator<T>, compare?: (a: T, b: T) => OrProm<boolean>): AsyncGenerator<T>;
```
Example
```javascript
[1, 2, 2, 3, 4, 5, 5, 1, 7]
  .async
  .unique() // Will produce [1, 2, 3, 4, 5, 1, 7]
  // The final 1 repeats as it's not duplicated in sequence

```

#### Sort

`sort` is a blocking operation as it requires all the data to be able to sort properly.  This means it will wait
on the entire sequence before producing new data.  The function operates identically to how `Array.prototype.sort` behaves.

```typescript
sort<T>(this: AsyncGenerator<T>, compare?: (a: T, b: T) => number): AsyncGenerator<T, any, any>;
```
Example
```javascript
'<file>'
  .async
  .read() // Now a sequence of lines
  .sort() // Sort lines alphabetically
  // Now a sequence of sorted lines

```

#### Batch

Allows for iterative grouping of streamed data, and produces a sequence of arrays.  Each array will be `batch` sized,
except for the final array which will be at most `batch` size.

```typescript
batch<T>(this: AsyncGenerator<T>, size: number): AsyncGenerator<T[]>;
```
Example
```javascript
'<file>'
  .async
  .read() // Generator of file lines
  .batch(20) // Generator of array of lines, at most 20 items in length
  .map(lines => lines.sort()) // Sort each batch
  // Generator of sorted list strings

```

#### Pair

`pair` allows for combining two sets of data into a single sequence of pairs.
The second value can either be a single value, which will be added to every item,
or it could be an iterable element that will match with each item as possible. If the second
iterator runs out, the remaining values can be affected by the mode parameter:
* `'empty'`  - Fill in with `undefined` once the second iterator is exhausted.  This is default for iterable values.
* `'repeat'` - Loop iteration on the secondary iterator.  This is default for string values.
* `'exact'`  - Stop the emitting values once the secondary iterator is exhausted.

```typescript
pair<T, U>(this: AsyncGenerator<T>, value: OrCallable<OrAsyncStream<U>>, mode?: PairMode): AsyncGenerator<[T, U]>;
```
Example
```javascript
'.ts'
  .async
  .dir() // List all '.ts' files
  .flatMap(file => file.async
    .read() // Read each file as a sequence of lines
    .pair(file) // Combine each line with the file name
    .map(([a,b]) => [b, a]) // Reverse the order of the columns
  )
  // Generator of file lines with, file name attached

```


### Text

Support for common textual operations.

As text operators, these only apply to sequences that
produce string values.



#### Columns

`columns` is similar to the unix `awk` in that it allows for production of
columns from a single line of text. This is useful for dealing with column
oriented output.  The separator defaults to all whitespace but can tailored
as needed by regex or string.

```typescript
columns(this: AsyncGenerator<string>, sep?: RegExp | string): AsyncGenerator<string[]>;
```
Example
```javascript
'<file>.tsv' // Tab-separated file
  .async
  .read() // Read as lines
  .columns('\t') // Separate on tabs
  // Now an array of tuples (as defined by tabs in the tsv)

```

#### Columns

Supports passing in column names to produce objects instead of tuples.  These values will be
matched with the columns produced by the separator. Any row that is shorter than the names
array will have undefined for the associated keys.

```typescript
columns<V extends readonly string[]>(this: AsyncGenerator<string>, names: V, sep?: RegExp | string): AsyncGenerator<Record<V[number], string>>;
```
Example
```javascript
'<file>.tsv' // Tab-separated file
  .async
  .read() // Read as lines
  .columns(['Name', 'Age', 'Major'], '\t') // Separate on tabs
  // Now an array of objects { Name: string, Age: string, Major: string } (as defined by tabs in the tsv)

```

#### Tokens

This operator allows for producing a single sequence of tokens out of lines of text.  The default separator is whitespace.

```typescript
tokens(this: AsyncGenerator<string>, sep?: RegExp | string): AsyncGenerator<string, any, any>;
```
Example
```javascript

'<file>'
  .async
  .read() // Read file as lines
  .tokens() // Convert to words
  .filter(x => x.length > 5) // Retain only words 6-chars or longer

```

#### Match

`match` is similar to tokens, but will emit based on a pattern instead of
just word boundaries.

In addition to simple regex or string patterns, there is built in support for some common use cases (`RegexType`)
* `'URL'` - Will match on all URLs
* `'EMAIL'` - Will match on all emails

Additionally, mode will determine what is emitted when a match is found (within a single line):
* `undefined` - (default) Return entire line
* `'extract'` - Return only matched element
* `'negate'` - Return only lines that do not match

```typescript
match(this: AsyncGenerator<string>, regex: RegExp | string | RegexType, mode?: MatchMode): AsyncGenerator<string>;
```
Example
```javascript
'<file>'
  .async
  .read()
  .match(/(FIXME|TODO)/, 'negate')
  // Exclude all lines that include FIXME or TODO

```

```javascript
'<file>'
  .async
  .read()
  .match(/\d{3}(-)?\d{3}(-)?\d{4}/, 'extract)
  // Return all phone numbers in the sequence

```

#### Replace

`replace` behaves identically to `String.prototype.replace`, but will only operate
on a single sequence value at a time.

```typescript
replace(this: AsyncGenerator<string>, pattern: RegExp | string, sub: string | Replacer): AsyncGenerator<string>;
```
Example
```javascript
 '<file>'
  .async
  .read()
  .replace(/TODO/, 'FIXME')
  // All occurrences replaced

```

#### Trim

`trim` behaves identically to `String.prototype.trim`, but will only operate on a single sequence value at a time

```typescript
trim(this: AsyncGenerator<string>): AsyncGenerator<string>;
```
Example
```javascript
'<file>'
  .async
  .read()
  .trim()
  // Cleans leading/trailing whitespace per line

```

#### SingleLine

`singleLine` is a convenience method for converting an entire block of
text into a single line.  This is useful when looking for patterns that
may span multiple lines.

```typescript
singleLine(this: AsyncGenerator<string>): AsyncGenerator<string>;
```
Example
```javascript
'<file>.html'
  .async
  .read()
  .singleLine() // Convert to a single line
  .replace(/<[^>]+?>/) // Remove all HTML tags

```

#### Join

This operator allows for combining a sequence of strings into a single value similar to `String.prototype.join`.

```typescript
join(this: AsyncGenerator<string>, joiner?: string | ((a: string[]) => string)): AsyncGenerator<string>;
```
Example
```javascript
'<file>'
  .async
  .read() // Read as a series of lines
  .join('\n')
  // Produces a single value of the entire file

```


### Limit

Support for limiting sequence values based on ordering



#### First

This will return the first `n` elements with a default of a single element.
```typescript
first<T>(this: AsyncGenerator<T>, n?: number): AsyncGenerator<T, void, unknown>;
```
Example
```javascript
'<file>'
  .async
  .read()
  .first(10) // Read first 10 lines

```

```javascript
'<file>'
  .async
  .read()
  .first() // Read first line

```

#### Skip

This will return all but the first `n` elements.

```typescript
skip<T>(this: AsyncGenerator<T>, n: number): AsyncGenerator<T>;
```
Example
```javascript
'<file>.csv'
  .async
  .read()
  .skip(1) // Skip header

```

#### Last

This will return the last `n` elements with a default of a single element.
Since this method requires knowledge of the length of the sequence to
work properly, this now becomes a blocking operator.

```typescript
last<T>(this: AsyncGenerator<T, any, any>, n?: number): AsyncGenerator<T, any, any>;
```
Example
```javascript
'<file>'
  .async
  .read()
  .last(7) // Read last 7 lines of file

```

```javascript
'<file>'
  .async
  .read()
  .last() // Read last line of file

```

#### Repeat

This will repeat the first `n` elements with a default of all elements.

```typescript
repeat<T>(this: AsyncGenerator<T>, n?: number): AsyncGenerator<T>;
```
Example
```javascript
'<file>'
  .async
  .read()
  .first(10) // Read first 10 lines

```


### Exec

Support for dealing with execution of external programs



#### ExecEach

Execute the command against each item in the sequence. Allow for a list of args
to prepend to the command execution.  The command's stdout is returned as individual
lines.

```typescript
execEach<T>(this: AsyncGenerator<T>, cmd: string, args: string[]): AsyncGenerator<string>;
```
Example
```javascript
'.ts'
  .async
  .dir() // Get all files
  .execEach('wc', '-l') // Execute word count for each line

```

#### Exec

Pipe the entire sequence as input into the command to be executed.  Allow for args to be
prepended to the command as needed.  If the output is specified as 'binary', the generator
will return a sequence of Buffers, otherwise will return strings

```typescript
exec(cmd: string, args: string[], output: 'line' | 'text'): AsyncGenerator<string>;
exec(cmd: string, args: string[], output: 'binary'): AsyncGenerator<Buffer>;
exec(cmd: string, args: string[]): AsyncGenerator<string>;
exec(cmd: string): AsyncGenerator<string>;
```
Example
```javascript
'.ts'
  .async
  .dir() // Get all files
  .read() // Read all files
  .exec('wc', ['-l']) // Execute word count for all files
  // Run in a single operation

```


### Export

Support for exporting data from a sequence



#### Stream

Converts a sequence into a node stream.  This readable stream should be
considered standard, and usable in any place a stream is expected. The mode
determines if the stream is string or `Buffer` oriented.

```typescript
stream<T>(this: AsyncGenerator<T>, mode?: IOType): Readable;
```
Example
```javascript
const stream = '<file>.png'
  .async
  .read('binary') // Read file as binary
  .exec('convert', ['-size=100x20']) // Pipe to convert function
  .stream('binary') // Read converted output into NodeJS stream

stream.pipe(fs.createWriteStream('out.png')); // Write out

```

#### Write

Emits the sequence contents to a write stream.  If the write stream is a string, it
is considered to be a file name. Buffer contents are written as is.  String contents
are written as lines.

```typescript
write<T extends string | Buffer | any>(this: AsyncGenerator<T>, writable: Writable | string): Writable;
```
Example
```javascript
'<file>.png'
  .async
  .read('binary') // Read file as binary
  .exec('convert', ['-size=100x20']) // Pipe to convert function
  .write('out.png') // Write file out

```

#### WriteFinal

Writes the entire stream to a file, as a final step. The write stream will not be created until all the values
have been emitted.  This is useful for reading and writing the same file.

```typescript
writeFinal(this: AsyncGenerator<string>, file: string): Promise<void>;
export declare class ExportPropOperators<T> {
```
Example
```javascript
'<file>'
  .async
  .read()
  .replace(/TEMP/, 'final')
  .writeFinal('<file>');

```

#### Values

Extract all sequence contents into a single array and return
as a promise

```typescript
get values(this: AsyncGenerator<T>): Promise<T[]>;
```
Example
```javascript
const values = await '<file>.csv'
  .async
  .read()
  .csv('Width', 'Depth', 'Height'])// Convert to objects
  .map(({Width, Height, Depth}) =>
    int(Width) * int(Height) * int(Depth) // Compute volume
  )
  .values // Get all values;

```

#### Value

Extract first sequence element and return as a promise

```typescript
get value(this: AsyncGenerator<T>): Promise<T>;
```
Example
```javascript
const name = await 'What is your name?'
  .async
  .prompt() // Prompt for name
  .value  // Get single value

```

#### Stdout

Simple method that allows any sequence to be automatically written to stdout

```typescript
get stdout(this: AsyncGenerator<T>): Writable;
```
Example
```javascript
'<file>'
  .async
  .read() // Read file
  .map(line => line.length) // Convert each line to it's length
  .stdout // Pipe to stdout

```

#### Console

Simple property that allows any sequence to be automatically called with `console.log`

```typescript
get console(this: AsyncGenerator<T>): Promise<void>;
```
Example
```javascript
'<file>'
 .async
 .read() // Read file
 .json()
 .console // Log out objects

```