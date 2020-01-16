<h1>
  <sub><img src="https://github.com/arciisine/nodesh/raw/master/images/logo.png" height="40"></sub>
  Nodesh - The Node Shell
</h1>

Nodesh is an `npm` package aimed at providing shell-like operations/simplicity within the node ecosystem.  The goal is to make working with files/folders, http requests, and transformations, as easy as possible.  The library is built upon the async generation constructs within ecmascript as well as stream constructs within the node ecosystem.  This means the performance is iterative and real-time, the same way piping works in a Unix shell.

**(remote-tokens.js) Example of processing URLs from the input stream** 

```javascript
#!/usr/bin/env -S npx @arcsine/nodesh

$stdin // Automatically pipe from stdin 
  .$match($pattern.URL, 'extract')  // Retain only URL patterns and emit as single values
  .$fetch() // Request each url that comes through
  .$tokens() // Break down returned webpage into tokens
  .$filter(x => 
    x.length >= 6 &&  // Retain words that are 6 chars or more
    x.charAt(0) === x.charAt(0).toUpperCase() // And that start with an uppercase letter
  )  
  .$stdout; // Pipe the token stream to stdout
```

**NOTE:** The shebang defined here is using `env`'s `-S` flag which will allow for the passing of multiple arguments in the shebang.

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
The tool revolves around the use of `async` generators, as denoted by `async function *`.  This allows for the iterative operation, as well as support for asynchronous operations.  This means everything within the framework is non-blocking.  This also means the primary way of using the framework is by accessing your data as an async generator.  The library has built in support for converting basic data types into async generators, as well as built-in support for common patterns.

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
Out of the box, the following types support the async iterator symbol (`AsyncIterable`):

#### Iterables
* Generator - This will return the generator, but as an async generator
* `Set` - This will return an async generator over the set contents
* `Map` - This will return an async generator over the map's entries [key, value]
* `Array` - This will return an async generator over the array contents
* `URLSearchParams` - This will generate over the key/value pairs
* `NodeJS:ReadStream` - This will return a line-oriented async generator over the read stream
  - `stream.Readable`
  - `http.IncomingMessage`
  - `fs.ReadStream`

**Example of read stream**
```typescript
const lineGenerator = $of(fs.createReadStream('data.txt'));

... or ...

const lineGenerator = fs.createReadStream('data.txt').$map(x => ...);


```

#### Primitives
The following primitives are also supported, but will return a generator that only has 
a single value, that of the primitive
* `String`
* `Number`
* `RegExp`
* `Boolean`
* `Buffer`

In addition to the built-in functionality, a global function `$of` is declared that will allow any value passed in to be converted to an async iterable.  If the item is iterable or is a stream, it will return the iteration as a generator, otherwise return the value as a single-valued generator.

**Example of simple value**
```typescript
const bigIntGen = $of(10000n);
```


### GlobalHelpers

Within the framework there are some common enough patterns that
exposing them globally proves useful.



####  $of

Will turn any value into a sequence. If the input value is of type:
* `Iterable` - Returns sequence of elements
* `AsyncIterable` - Returns sequence of elements
* `Readable`/`ReadStream` - Returns a sequence of lines read from stream
* Everything else - Returns a sequence of a single element

```typescript
static $of(el: Writable): AsyncGenerator<void>;
static $of(el: Readable): AsyncGenerator<string>;
static $of(el: string): AsyncGenerator<string>;
static $of<T>(el: AsyncIterable<T>): AsyncGenerator<T>;
static $of<T>(el: Iterable<T>): AsyncGenerator<T>;
static $of<T>(el: AsyncIterable<T>): AsyncGenerator<T>;
static $of<T>(el: T[]): AsyncGenerator<T>;
```
Example
```javascript
$of([1,2,3])
   .$map(x => x ** 2)

 // Should be identical

 [1,2,3]
   .$map(x => x ** 2)

```

#### $exec

Top level access to execute a program

```typescript
static get $exec(): AsyncIterable<any>['$exec'];
```
Example
```javascript
$exec('ls', ['-lsa'])
 .$columns(['blockSize', 'perms', 'size', 'group', 'owner', 'month', 'day', 'time', 'path'])
 .$console

```

#### $registerOperator

In the process of using the tool, there may be a need for encapsulating common
operations.  By default, `$wrap` provides an easy path for re-using functionality,
but it lacks the clarity of intent enjoyed by the built in operators.

```typescript
static get $registerOperator(): (op: Function) => void;
```
Example
```javascript
/** @template T */
class AsyncIterable {
  /** @returns {AsyncIterable<T>} */
  $reverse() {
    return this
      .$collect() // Gather the entire sequence as an array
      .$flatMap(x => x.reverse()); // Reverse it and flatten
  }
}

$registerOperator(AsyncIterable);

$stdin
 .$reverse()
 .$stdout;

```

#### $argv

The cleaned argv parameters for the running script. Starting at index 0,
is the first meaning parameter for the script.  This differs from `process.argv`
by excluding the executable and script name.  This is useful as the script may
be invoked in many different ways and the desire is to limit the amount of
guessing needed to handle inputs appropriately.

NOTE: If you are going to use a command line parsing tool, then you would continue to
use `process.argv` as normal.

```typescript
static get $argv(): string[];
```
Example
```javascript
(argv[0] ?? 'Enter a file name:'.$prompt())
  // Pull in name from argv[0] or prompt if missing
  .$read() // Read file

```

#### $stdin

Provides direct access to stdin as sequence of lines

```typescript
static get $stdin(): AsyncIterable<string>;
```
Example
```javascript
$stdin // Stream stdin, one line at a time
 .$map(line => line.split('').reverse().join('')) // Reverse each line
 .$stdout // Pipe to stdout

```

#### $env

A case insensitive map for accessing environment variables. Like `process.env`, but
doesn't require knowledge of the case.  Useful for simplifying script interactions.

```typescript
static get $env(): Record<string, string>;
```
Example
```javascript
($env.user_name ?? ask('Enter a user name')) // Prompt user name if there
  .$map(userName => ... )

```

#### $pattern

Common patterns that can be used where regular expressions are supported

```typescript
static get $pattern(): {
URL: RegExp;EMAIL: RegExp;PROPER_NAME: RegExp;};
```
Example
```javascript
<file>
 .$read() // Read a file
 .$match($pattern.URL, 'extract') // Extract URLs
 .$filter(url => url.endsWith('.com'))

```

####  $range

Produces a numeric range, between start (1 by default) and stop (inclusive).  A step
parameter can be defined to specify the distance between iterated numbers.

```typescript
static $range(stop: number, start?: number, step?: number): AsyncIterable<number>;
```
Example
```javascript
$range(1, 3)
  .$map(x => x**2)
  // sequence of 1, 4, 9

$range(10, 1, 2)
  // sequence of 1, 3, 5, 7, 9

```

## Operators
The entirety of this project centers on the set of available operators.  These operators can be broken into the following groups

* [Core](#core)
* [File](#file)
* [Transform](#transform)
* [Text](#text)
* [Limit](#limit)
* [Exec](#exec)
* [Export](#export)
* [Advanced](#advanced)


### Core

The core functionality provides some very basic support for sequences



#### $forEach

This operator is a terminal action that receives each element of the sequence in sequence,
but returns no value.  This function produces a promise that should be waited on to ensure the
sequence is exhausted.

```typescript
$forEach<T>(this: AsyncIterable<T>, fn: PromFunc<T, any>): $AsyncIterable<void>;
```
Example
```javascript
fs.createReadStream('<file>') //  Now a line-oriented sequence
  .$forEach(console.log)  // Will output each line

```

#### $map

Converts the sequence of data into another, by applying an operation
on each element.

```typescript
$map<T, U>(this: AsyncIterable<T>, fn: PromFunc<T, U>): $AsyncIterable<U>;
```
Example
```javascript
fs.createReadStream('<file>') //  Now a line-oriented sequence
 .$map(line => line.toUpperCase())
 // is now a sequence of all uppercase lines

```

#### $filter

Determines if items in the sequence are valid or not. Invalid items
are discarded, while valid items are retained.

```typescript
$filter<T>(this: AsyncIterable<T>, pred: PromFunc<T, boolean>): $AsyncIterable<T>;
```
Example
```javascript
fs.createReadStream('<file>') //  Now a line-oriented sequence
  .$filter(x => x.length > 10)
  // Will retain all lines that are more than 10 characters

```

#### $flatten

Flattens a sequence of arrays, or a sequence of sequences.  This allows for operators that
return arrays/sequences, to be able to be represented as a single sequence.

```typescript
$flatten<T, U>(this: AsyncIterable<AsyncIterable<U> | Iterable<U>>): $AsyncIterable<U>;
```
Example
```javascript
fs.createReadStream('<file>') //  Now a line-oriented sequence
  .$map(line => line.split(/\s+/g)) // Now a string[] sequence
  .$flatten() // Now a string sequence for each word in the file

```

#### $flatMap

This is a combination of `$map` and `$flatten` as they are common enough in usage to warrant a
combined operator.  This will map the the contents of the sequence (which produces an array
or sequence), and producing a flattened output.

```typescript
$flatMap<T, U>(this: AsyncIterable<T>, fn: PromFunc<T, AsyncIterable<U> | Iterable<U>>): $AsyncIterable<U>;
```
Example
```javascript
fs.createReadStream('<file>') //  Now a line-oriented sequence
  .$flatMap(line => line.split(/\s+/g)) // Now a word sequence for the file

```

#### $reduce

This is the standard reduce operator and behaves similarly as `Array.prototype.reduce`.  This operator
takes in an accumulation function, which allows for computing a single value based on visiting each element
in the sequence.  Given that reduce is a comprehensive and produces a singular value, this operation cannot
stream and will block until the stream is exhausted. Normally it is common to understand `$map` and `$filter` as
being implemented by `$reduce`, but in this situation they behave differently.
```typescript
$reduce<T, U>(this: AsyncIterable<T>, fn: PromFunc2<U, T, U> & {init?: () => U;}, acc?: U): $AsyncIterable<U>;
```
Example
```javascript
fs.createReadStream('<file>') //  Now a line-oriented sequence
  .$flatMap(line => line.split(/\s+/g)) // Now a string sequence for each word in the file
  .$reduce((acc, token) => {
    acc[token] = (acc[token] ?? 0) + 1;
    return acc;
  }, {}); // Produces a map of words and their respective frequencies within the document

```

#### $collect

Gathers the entire sequence output as a single array.  This is useful if you need the entire stream to perform an action.

```typescript
$collect<T>(this: AsyncIterable<T>): $AsyncIterable<T[]>;
```
Example
```javascript
fs.createReadStream('<file>') //  Now a line-oriented sequence
  .$collect() // Now a sequence with a single array (of all the lines)
  .$map(lines => lines.join('\n'))
  // Produces a single string of the whole file

```

#### $wrap

This is the simplest mechanism for extending the framework as the operator takes in a function that operates on the sequence of
data as a whole.  It will consume the sequence and produce an entirely new sequence.

```typescript
$wrap<T, U>(this: AsyncIterable<T>, fn: (input: AsyncIterable<T>) => (AsyncIterable<U> | Iterable<U>)): $AsyncIterable<U>;
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

fs.createReadStream('<file>') //  Now a line-oriented sequence
  .$wrap(translate.bind(null, 'fr')); // Produces a sequence of french-translated word

```

#### $onError

If an error occurs, use the provided sequence instead

```typescript
$onError<T>(this: AsyncIterable<T>, alt: OrCallable<AsyncIterable<T> | Iterable<T>>): $AsyncIterable<T>;
```
Example
```javascript
'<file>'.
 .$read()
 .$onError(() => `Sample Text`)

```


### File

Some of the most common shell operations are iterating through files,
and operating upon those files.  To support this, the framework supports
producing files as a sequence of file objects or filenames, given a file
extension or a regex pattern. With `String`s and `RegExp`s supporting the
`Symbol.asyncIterator` property, these are the most common way of finding files.



#### $read

This operator will treat the inbound string sequence as file names, and will convert the filename (based on IOType)
* `text` (default) - The sequence will produce as series of lines of text
* `binary` - The sequence will produce a series of `Buffer` objects

If singleValue is set to true, this produce a single value for the whole stream instead of chunk by chunk.  This
mode can be easier to work with for certain operations, but is much more memory intensive.

```typescript
$read(this: AsyncIterable<string>, config?: Omit<ReadStreamConfig, 'mode'>): $AsyncIterable<string>;
$read(this: AsyncIterable<string>, config: ReadStreamConfig<'text'>): $AsyncIterable<string>;
$read(this: AsyncIterable<string>, config: ReadStreamConfig<'binary'>): $AsyncIterable<Buffer>;
$read(this: AsyncIterable<string>, config: ReadStreamConfig<'raw'>): $AsyncIterable<fs.ReadStream>;
```
Example
```javascript
'<file>'
  .$read('binary') // Read as a series of buffers
  .$reduce((acc, buffer) => {
    return acc  + buffer.length;
  }, 0); // Count number of bytes in file

```

```javascript
'<file>'
  .$read('binary', true) // Read as a single buffer
  .$map(buffer => buffer.length) // Count number of bytes in file


```

#### $dir

`dir` provides the ability to recursively search for files within a file system.  It expects as the
input sequence type:
* A `string` which represents a suffix search on file names (e.g. `.csv`)
* A `RegExp` which represents a file pattern to search on (e.g. `/path\/sub\/.*[.]js/`)

In addition to the input sequence type, there is an optional config to affect the output.
By default the output of this sequence will be a series of file names, relative to the `process.cwd()`
that will be eligible for reading or any other file operation.

```typescript
$dir(this: AsyncIterable<string | RegExp>, config: ReadDirConfig & {full: true;}): $AsyncIterable<ScanEntry>;
$dir(this: AsyncIterable<string | RegExp>, config?: Omit<ReadDirConfig, 'full'>): $AsyncIterable<string>;
```
Example
```javascript
'.csv'
  .$dir({ full: true }) // List all '.csv' files, recursively
  .$forEach(f => {
    // Display the filename, and it's modification time
    console.log(f.file, f.stats.mtime);
  });

```


### Transform

Standard operators regarding common patterns for transformations



#### $notEmpty

This is a special type of filter that excludes `null`, `undefined` and `''`.
Useful for removing empty values.

```typescript
$notEmpty<T>(this: AsyncIterable<T>): $AsyncIterable<T>;
```
Example
```javascript
'<file>'
  .$read()
  .$notEmpty() // Return all non-empty lines of the file

```

#### $tap

`$tap` provides the ability to inspect the sequence without affecting it's production.  The function passed in
can produce a promise that will be waited on, if needed.

```typescript
$tap<T>(this: AsyncIterable<T>, visit?: PromFunc<T, any>): $AsyncIterable<T>;
```
Example
```javascript
'.csv'
  .$dir()
  .$tap(({stats}) => collectMetrics(stats))
  // Stream unchanged, but was able to track file stat information

```

#### $unique

`$unique` will ensure the output sequence does not have any consecutive duplicates, similar to the unix `uniq` command.
The uniqueness is only guaranteed linearly, to allow for streaming.  Otherwise this would need to wait
for all data before proceeding.  You can also specify a custom equality function as needed.

```typescript
$unique<T>(this: AsyncIterable<T>): $AsyncIterable<T>;
```
Example
```javascript
[1, 2, 2, 3, 4, 5, 5, 1, 7]
  .$unique() // Will produce [1, 2, 3, 4, 5, 1, 7]
  // The final 1 repeats as it's not duplicated in sequence

```

#### $unique

`$unique` also supports configuration for custom comparators, as well as the ability to count the values as they come through.

```typescript
$unique<T>(this: AsyncIterable<T>, config: {compare?: AsyncCompare<T>;count: true;}): $AsyncIterable<[T, number]>;
$unique<T>(this: AsyncIterable<T>, config: {compare?: AsyncCompare<T>;count?: false;}): $AsyncIterable<T>;
```
Example
```javascript
[1, 2, 2, 2, 3, 4, 5, 5]
  .$unique({ count: true }) // Will produce [[1, 1], [2, 3], [3, 1], [4, 1], [5, 2]]

```

```javascript
[0, 2, 2, 2, 4, 1, 3, 2]
  .$unique({ count: true, compare: (x,y) => x%2 === y%2 })
  // Will produce [0, 1, 3, 2] as it captures the first even or odd of a run

```

#### $sort

`$sort` is a blocking operation as it requires all the data to be able to sort properly.  This means it will wait
on the entire sequence before producing new data.  The function operates identically to how `Array.prototype.sort` behaves.

```typescript
$sort<T>(this: AsyncIterable<T>, compare?: (a: T, b: T) => number): $AsyncIterable<T>;
```
Example
```javascript
'<file>'
  .$read() // Now a sequence of lines
  .$sort() // Sort lines alphabetically
  // Now a sequence of sorted lines

```

#### $batch

Allows for iterative grouping of streamed data, and produces a sequence of arrays.  Each array will be `$batch` sized,
except for the final array which will be at most `batch` size.

```typescript
$batch<T>(this: AsyncIterable<T>, size: number): $AsyncIterable<T[]>;
```
Example
```javascript
'<file>'
  .$read() // Generator of file lines
  .$batch(20) // Generator of array of lines, at most 20 items in length
  .$map(lines => lines.sort()) // Sort each batch
  // Generator of sorted list strings

```

#### $pair

`$pair` allows for combining two sets of data into a single sequence of pairs.
The second value can either be a single value, which will be added to every item,
or it could be an iterable element that will match with each item as possible. If the second
iterator runs out, the remaining values can be affected by the mode parameter:
* `'empty'`  - Fill in with `undefined` once the second iterator is exhausted.  This is default for iterable values.
* `'repeat'` - Loop iteration on the secondary iterator.  This is default for string values.
* `'exact'`  - Stop the emitting values once the secondary iterator is exhausted.

```typescript
$pair<T, U>(this: AsyncIterable<T>, value: OrCallable<U | Iterable<U> | AsyncIterable<U>>, mode?: PairMode): $AsyncIterable<[T, U]>;
```
Example
```javascript
'.ts'
  .$dir() // List all '.ts' files
  .$flatMap(file => file
    .$read() // Read each file as a sequence of lines
    .$pair(file) // Combine each line with the file name
    .$map(([a,b]) => [b, a]) // Reverse the order of the columns
  )
  // Generator of file lines with, file name attached

```

#### $join

This operator allows for combining a sequence of elements with a join element

```typescript
$join<T>(this: AsyncIterable<T>, joiner: T | $AsyncIterable<T>): $AsyncIterable<T>;
```
Example
```javascript
'<file>'
  .$read() // Read as a series of lines
  .$join('\n')
  // Produces a sequence of lines inter-spliced with new lines

```

#### $concat

Combine multiple streams, linearly

```typescript
$concat<T>(this: AsyncIterable<T>, other: AsyncIterable<T>, ...rest: AsyncIterable<T>[]): AsyncGenerator<T, void, unknown>;
```
Example
```javascript
$range(1, 10)
 .$concat($range(11, 20), $range(21, 30))
 .$collect()
 .$map(all => all.length)
 .$stdout; // Displays 30

```


### Text

Support for common textual operations.

As text operators, these only apply to sequences that
produce string values.



#### $columns

`$columns` is similar to the unix `awk` in that it allows for production of
columns from a single line of text. This is useful for dealing with column
oriented output.  The separator defaults to all whitespace but can tailored
as needed by regex or string.

```typescript
$columns(this: AsyncIterable<string>, sep?: string | RegExp): $AsyncIterable<string[]>;
```
Example
```javascript
'<file>.tsv' // Tab-separated file
  .$read() // Read as lines
  .$columns('\t') // Separate on tabs
  // Now an array of tuples (as defined by tabs in the tsv)

```

#### $columns

Supports passing in column names to produce objects instead of tuples.  These values will be
matched with the columns produced by the separator. Any row that is shorter than the names
array will have undefined for the associated keys.

```typescript
$columns<V extends readonly string[]>(this: AsyncIterable<string>, config: V | ColumnsConfig<V>): $AsyncIterable<Record<V[number], string>>;
```
Example
```javascript
'<file>.tsv' // Tab-separated file
  .$read() // Read as lines
  .$columns({names: ['Name', 'Age', 'Major'], sep: '\t'}) // Separate on tabs
  // Now an array of objects { Name: string, Age: string, Major: string } (as defined by tabs in the tsv)

```

#### $tokens

This operator allows for producing a single sequence of tokens out of lines of text.  The default separator is whitespace.

```typescript
$tokens(this: AsyncIterable<string>, sep?: Pattern): $AsyncIterable<string>;
```
Example
```javascript

'<file>'
  .$read() // Read file as lines
  .$tokens() // Convert to words
  .$filter(x => x.length > 5) // Retain only words 6-chars or longer

```

#### $match

`$match` is similar to tokens, but will emit based on a pattern instead of
just word boundaries.

Additionally, mode will determine what is emitted when a match is found (within a single line):
* `undefined` - (default) Return entire line
* `'extract'` - Return only matched element
* `'negate'` - Return only lines that do not match

```typescript
$match(this: AsyncIterable<string>, regex: Pattern, mode?: 'extract' | 'negate'): $AsyncIterable<string>;
```
Example
```javascript
'<file>'
  .$read()
  .$match(/(FIXME|TODO)/, 'negate')
  // Exclude all lines that include FIXME or TODO

```

```javascript
'<file>'
  .$read()
  .$match(/\d{3}(-)?\d{3}(-)?\d{4}/, 'extract)
  // Return all phone numbers in the sequence

```

#### $replace

`$replace` behaves identically to `String.prototype.replace`, but will only operate
on a single sequence value at a time.

```typescript
$replace(this: AsyncIterable<string>, pattern: Pattern, sub: string | Replacer): $AsyncIterable<string>;
```
Example
```javascript
 '<file>'
  .$read()
  .$replace(/TODO/, 'FIXME')
  // All occurrences replaced

```

#### $replace

`$replace` also supports a mode where you can pass in a series of tokens, and replacements, and will apply all
consistently. The largest token will win if there is any overlap.

```typescript
$replace(this: AsyncIterable<string>, pattern: Record<string, string>): $AsyncIterable<string>;
```
Example
```javascript
 '<file>.html'
  .$read()
  .$replace({
     '<': '&lt;',
     '>': '&gt;',
     '"': '&quot;'
  })
  // Html special chars escaped

```

#### $trim

`$trim` behaves identically to `String.prototype.trim`, but will only operate on a single sequence value at a time

```typescript
$trim(this: AsyncIterable<string>): $AsyncIterable<string>;
```
Example
```javascript
'<file>'
  .$read()
  .$trim()
  // Cleans leading/trailing whitespace per line

```

#### $toString

`$toString` is a convenience method for converting an entire block of
text into a single string.  This is useful when looking for patterns that
may span multiple lines.

```typescript
$toString(this: AsyncIterable<string>): $AsyncIterable<string>;
```
Example
```javascript
'<file>.html'
  .$read()
  .$toString() // Convert to a single string
  .$replace(/<[^>]+?>/) // Remove all HTML tags

```


### Limit

Support for limiting sequence values based on ordering



#### $first

This will return the first `n` elements with a default of a single element.
```typescript
$first<T>(this: AsyncIterable<T>, n?: number): $AsyncIterable<T>;
```
Example
```javascript
'<file>'
  .$read()
  .$first(10) // Read first 10 lines

```

```javascript
'<file>'
  .$read()
  .$first() // Read first line

```

#### $skip

This will return all but the first `n` elements.

```typescript
$skip<T>(this: AsyncIterable<T>, n: number): $AsyncIterable<T>;
```
Example
```javascript
'<file>.csv'
  .$read()
  .$skip(1) // Skip header

```

#### $last

This will return the last `n` elements with a default of a single element.
Since this method requires knowledge of the length of the sequence to
work properly, this now becomes a blocking operator.

```typescript
$last<T>(this: AsyncIterable<T>, n?: number): $AsyncIterable<T>;
```
Example
```javascript
'<file>'
  .$read()
  .$last(7) // Read last 7 lines of file

```

```javascript
'<file>'
  .$read()
  .$last() // Read last line of file

```

#### $repeat

This will repeat the first `n` elements with a default of all elements.

```typescript
$repeat<T>(this: AsyncIterable<T>, n?: number): $AsyncIterable<T>;
```
Example
```javascript
'<file>'
  .$read()
  .$first(10) // Read first 10 lines

```


### Exec

Support for dealing with execution of external programs



#### $exec

Pipe the entire sequence as input into the command to be executed.  Allow for args and flags to be
appended to the command as needed.  If the output is specified as 'binary', the generator
will return a sequence of `Buffer`s, otherwise will return `string`s

```typescript
$exec(cmd: string, config?: string[] | Omit<ExecConfig, 'mode'>): $AsyncIterable<string>;
$exec(cmd: string, config: ExecConfig<'text'>): $AsyncIterable<string>;
$exec(cmd: string, config: ExecConfig<'binary'>): $AsyncIterable<Buffer>;
$exec(cmd: string, config: ExecConfig<'raw'>): $AsyncIterable<CompletableStream>;
```
Example
```javascript
'.ts'
  .$dir() // Get all files
  .$read() // Read all files
  .$exec('wc', ['-l']) // Execute word count for all files
  // Run in a single operation

```

```javascript
'.ts'
  .$dir() // Get all files
  .$read() // Read all files
  .$exec('npx', {
     args: ['tslint'],
     spawn : {
       env : { NO_COLOR: '1' }
     }
  }) // Tslint every file
  // Run in a single operation

```


### Export

Support for exporting data from a sequence. For all methods that convert the data to a stream (e.g. $write, $writeFinal, $stdout)
`Buffer` data implies raw binary data and will be outputted without being processed.
Otherwise treat data as line oriented output and will have newlines appended to each sequence element..



#### $stream

Converts a sequence into a node stream.  This readable stream should be
considered standard, and usable in any place a stream is expected.
If the mode is specified, it determines if the stream is string or `Buffer` oriented.
If the mode is not specified, then `Buffer` data implies raw binary data with no processing.
Otherwise treat data as line oriented output (with newlines appended).

```typescript
$stream<T>(this: AsyncIterable<T>, mode?: IOType): Readable;
```
Example
```javascript
const stream = '<file>.png'
  .$read('binary') // Read file as binary
  .$exec('convert', ['-size=100x20']) // Pipe to convert function
  .$stream('binary') // Read converted output into NodeJS stream

stream.pipe(fs.createWriteStream('out.png')); // Write out

```

#### $write

Emits the sequence contents to a write stream.  If the write stream is a string, it
is considered to be a file name. Buffer contents are written as is.  String contents
are written as lines.

```typescript
$write<T extends string | Buffer | any>(this: AsyncIterable<T>, writable: Writable | string): $AsyncIterable<void>;
```
Example
```javascript
'<file>.png'
  .$read('binary') // Read file as binary
  .$exec('convert', ['-size=100x20']) // Pipe to convert function
  .$write('out.png') // Write file out

```

#### $writeFinal

Writes the entire stream to a file, as a final step. The write stream will not be created until all the values
have been emitted.  This is useful for reading and writing the same file.

```typescript
$writeFinal(this: AsyncIterable<Buffer | string>, file: string): $AsyncIterable<void>;
export declare class ExportPropOperators<T> {
```
Example
```javascript
'<file>'
  .$read()
  .$replace(/TEMP/, 'final')
  .$writeFinal('<file>');

```

#### $values

Extract all sequence contents into a single array and return
as a promise

```typescript
get $values(this: AsyncIterable<T>): Promise<T[]>;
```
Example
```javascript
const values = await '<file>.csv'
  .$read()
  .$csv('Width', 'Depth', 'Height'])// Convert to objects
  .$map(({Width, Height, Depth}) =>
    int(Width) * int(Height) * int(Depth) // Compute volume
  )
  .$values // Get all values;

```

#### $value

Extract first sequence element and return as a promise

```typescript
get $value(this: AsyncIterable<T>): Promise<T>;
```
Example
```javascript
const name = await 'What is your name?'
  .$prompt() // Prompt for name
  .$value  // Get single value

```

#### $stdout

Simple method that allows any sequence to be automatically written to stdout.
`Buffer` data will be written as is, and all other data will be treated as line-oriented output
with newlines appended.

```typescript
get $stdout(this: AsyncIterable<T>): $AsyncIterable<void>;
```
Example
```javascript
'<file>'
  .$read() // Read file
  .$map(line => line.length) // Convert each line to it's length
  .$stdout // Pipe to stdout

```

#### $console

Simple property that allows any sequence to be automatically called with `console.log`.
Useful for retaining the structure/formatting (e.g. arrays, objects) of data being processed in the stream.

```typescript
get $console(this: AsyncIterable<T>): $AsyncIterable<void>;
```
Example
```javascript
'<file>'
 .$read() // Read file
 .$json()
 .$console // Log out objects

```


### Advanced

Advanced operators represent more complex use cases.



#### $parallel

Run iterator in parallel, returning values in order of first completion.  If the passed in function produces
an async generator, only the first value will be used.  This is because the method needs an array of promises
and an AsyncIterable cannot produce an array of promises as it's length is unknown until all promises are
resolved.

The default concurrency limit is number of processors minus one. This means the operator will process the sequence in order
until there are `concurrent` pending tasks, and will only fetch the next item once there is capacity.

```typescript
$parallel<T, U = T>(this: AsyncIterable<T>, op: (item: T) => AsyncIterable<U> | Promise<U>, concurrent?: number): $AsyncIterable<U>;
```
Example
```javascript
[10, 9, 8, 7, 6, 5, 4, 2, 1]
 .$parallel(x => (x).$wait(x * 1000))
 .$console

```
