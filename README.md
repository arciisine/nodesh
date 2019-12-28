# Node Shell
Node shell is an npm package aimed at providing bash-like operations/simplicity within the node ecosystem.  The goal is to make working with files/folders, http requests, and transformations, as as easy as possible.  The library is built upon the async generation constructs within Ecmascript as well as stream constructs within the node ecosystem.  This means the performance is iterative and real-time, just in the same way piping works in a Unix shell.

**(remote-tokens.js) Example of processing URLs from the input stream** 

```javascript
#!/bin/npx nodesh

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
  + [Core](#core)
  + [Files](#files)
  + [Transform](#transform)
  + [Text](#text)
  + [Limit](#limit)
  + [Net](#net)
  + [Exec](#exec)
  + [Data](#data)
  + [Export](#export)
* [Creating a Custom Operator](#creating-a-custom-operator)

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
Out of the box, the following types support an `.async` property that returns an async generator for the supported type.  Currently the supported types are:

#### Iterables
* Generator - This will return the generator, but as an async generator
* `Set` - This will return an async generator over the set contents
* `Map` - This will return an async generator over the map's entries [key, value]
* `NodeJS:ReadStream` - This will return a line-oriented async generator over the read stream

**Example of read stream**
```typescript
const lineGenerator = fs.createReadStream('data.txt').async;
```

#### Primitives
The following primitives also support `.async`, but will return a generator that only has 
a single value, that of the primitive
* `String`
* `Number`
* `RegExp`

In addition to the built-in functionality, a global function `of` is declared that will allow any value passed in to be converted to an async generator.  If the item is iterable or is a stream, it will return the iteration as a generator, otherwise return the value as a single-valued generator.

**Example of simple value**
```typescript
const bigIntGen = of(10000n);

...

const numberGen = 100000.async;
const numberGen2 = of(10000);

```

## Global Helpers
Within the framework there are some common enough patterns that exposing them globally proves useful.  

### Stdin
```
stdin: AsyncGenerator<string>
```

Provides direct access to stdin as sequence of lines.

```javascript
stdin // Stream stdin, one line at a time
  .map(line => line.split('').reverse().join('')) // Reverse each line
  .stdout // Pipe to stdout
```

### Ask
```

Allows for simple prompting as a sequence of lines.  Here a user can be prompted for information, with each line (newline terminated) acting as a single value in the sequence.


```javascript
ask('Which file to output?') // Read file name (will require a non-empty string)
  .first()
  .read() // Read file
  .stdout // Pipe to stdout
```

### Argv
```
argv: string[];
```

The cleaned argv parameters for the running script. Starting at index 0, is the first meaning parameter for the script.  This differs from `process.argv` by excluding the executable and script name.  This is useful as the script may be invoked in many different ways and the desire is to limit the amount of guessing needed to handle inputs appropriately.  If you are going to use a command line parsing tool, then you would continue to use `process.argv` as normal.

```javascript
(argv[0] ?? ask('Enter a file name:')) 
  // Pull in name from argv[0] or prompt if missing
  .async
  .read() // Read file
```

### Env
```
env: Record<string, string>
```

A case insensitive map for accessing environment variables. Like `process.env`, but doesn't require knowledge of the case.  Useful for simplifying script interactions.

```javascript
(env.user_name ?? ask('Enter a user name')) // Prompt user name if there
  .async // Can call async on sequences and it will return the same value
  .map(userName => ... ) 
```
### Of
```
of: <T>(x: T | Iterable<T> | AsyncIterable<T> | AsyncGenerator<T>) => AsyncGenerator<T>
```

Will turn any value into a sequence. If the input value is of type:
* `Iterable` - Returns sequence of elements
* `AsyncIterable` - Returns sequence of elements
* `AsyncGenerator` - Returns sequence of elements
* `Readable`/`ReadStream` - Returns a sequence of lines read from stream
* Everything else - Returns a sequence of a single element

```javascript
of([1,2,3])
  .map(x => x ** 2)

// Should be identical

[1,2,3].async
  .map(x => x ** 2)  

```

### Range
```
range: (stop: number, start?: number, step?: number) => AsyncGenerator<number>
```

Produces a numeric range, between start (1 by default) and stop (inclusive).  A step
parameter can be defined to specify the distance between iterated numbers.

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

#### Map
```
map<U>(fn: (item: T) => OrProm<U>): AsyncGenerator<U>
```

Converts the sequence of data into another, by applying an operation on each element. 
```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .map(line => line.toUpperCase()) 
  // is now a sequence of all uppercase lines
```

#### Filter
```
filter(pred: (item: T) => OrProm<boolean>): AsyncGenerator<T>
```

Determines if items in the sequence are valid or not. Invalid items are discarded, while valid items are retained.

```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .filter(x => x.length > 10) 
  // Will retain all lines that are more than 10 characters
```

#### For Each
```
forEach(fn: (item: T) => OrProm<any>): Promise<void>
```

This operator is a terminal action that receives each element of the sequence in sequence, but returns no value.  This function produces a promise that should be waited on to ensure the sequence is exhausted.

```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .forEach(console.log)  // Will output each line
```

#### Flatten
```
flatten<U>(this: AsyncGenerator<U[]> | AsyncGenerator<AsyncGenerator<U>>): AsyncGenerator<U>
```

Flattens a sequence of arrays, or a sequence of sequences.  This allows for operators that return arrays/sequences, to be able to be represented as a single sequence.

```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .map(line => line.split(/\s+/g)) // Now a string[] sequence
  .flatten() // Now a string sequence for each word in the file
```

#### Flat Map 
```
flatMap<U>(fn: (item: T) => Gen<U> | { async: AsyncGenerator<U> }): AsyncGenerator<U>
```

This is a combination of `map` and `flatten` as they are common enough in usage to warrant a combined operator.  This will map the the contents of the sequence (which produces an array or sequence), and producing a flattened output.

```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence
  .flatMap(line => line.split(/\s+/g)) // Now a word sequence for the file
```

#### Reduce
```
reduce<U>(fn: Reducer<U, T>, acc: U): AsyncGenerator<U>
```

This is the standard reduce operator and behaves similarly as `Array.prototype.reduce`.  This operator takes in an accumulation function, which allows for computing a single value based on visiting each element in the sequence.  Given that reduce is a comprehensive and produces a singular value, this operation cannot stream and will block until the sequence is exhausted. Normally it is common to understand `map` and `filter` as being implemented by `reduce`, but in this situation they behave differently.

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
```
collect(this: AsyncGenerator<T>): AsyncGenerator<T>
```

`collect` gathers the entire sequence output as a single array.  This is useful if you need the entire sequence to perform an action.

```javascript
fs.createReadStream('<file>')
  .async //  Now a line-oriented sequence  
  .collect() // Now a sequence with a single array (of all the lines)
  .map(lines => lines.join('\n'))
  // Produces a single string of the whole file
```

#### Wrap
```
wrap<U>(fn: (iter: AsyncGenerator<T>) => AsyncGenerator<U>): AsyncGenerator<U>
```

This is the simplest mechanism for extending the framework as the operator takes in a function that operates on the sequence of data as a whole.  It will consume the sequence and produce an entirely new sequence.

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

### Files
Some of the most common shell operations are iterating through files, and operating upon those files.  To support this, the framework supports producing files as a sequence of file objects or filenames, given a file extension or a regex pattern. With `String`s and `RegExp`s supporting the `.async` property, these are the most common way of finding files.

#### Read
```
read(this: AsyncGenerator<string>, type?: IOType): AsyncGenerator<string>
```

This operator will treat the inbound string sequence as file names, and will convert the filename (based on IOType) to:

* `line` (default) - The sequence will produce as series of lines of text
* `text` - The sequence will produce the entire file contents as a single text string
* `binary` - The sequence will produce a series of `Buffer` objects


```javascript
'<file>'
  .async //  Now a sequence of a single value, a file name
  .read('binary') // Read as a series of buffers
  .reduce((acc, buffer) => { 
    return acc  + buffer.length;
  }, 0); // Count number of bytes in file

'<file>'
  .async //  Now a sequence of a single value, a file name
  .read('text') // Read as a single string
  .map(text => text.length); // Count number of characters in file

```
#### Dir
```
dir(this: AsyncGenerator<string | RegExp>, config?: DirConfig): AsyncGenerator<string | ScanEntry>
```

`dir` provides the ability to recursively search for files within a file system.  It expects as the input sequence type:
* A `string` which represents a suffix search on file names (e.g. `.csv`)
* A `RegExp` which represents a file pattern to search on (e.g. `/path\/sub\/.*[.]js/`)

In addition to the input sequence type, there is an optional config to affect the output.  By default the output of this sequence will be a series of file names, relative to the `process.cwd()` that will be eligible for reading or any other file operation.

The config shape looks like: 
```typescript
type DireConfig = { 
  // The starting point for all file searches (defaults to process.cwd())
  base?: string; 
  // Whether or not to return just the file name (default) or the full Scan object (true)
  full?: boolean;
};
```

If a full return type is desired, the resulting sequence will return objects of the following type:
```typescript
type ScanEntry = {
  // Fully qualified file name
  file: string;
  // File name relative to base
  relative: string;
  // The fs.stats output, includes mtime/ctime useful for sorting searching
  stats: fs.Stats;
}
```

Simple file example:
```javascript

'.csv'
  .async
  .dir({ full: true }) // List all '.csv' files, recursively
  .forEach(f => { 
    // Display the filename, and it's modification time
    console.log(f.file, f.stats.mtime);
  })
```

### Transform

#### Not Empty
```
notEmpty(): AsyncGenerator<T>
```

This is a special type of filter that excludes `null`, `undefined` and `''`.  Useful for removing empty values.

```javascript
'<file>'
  .async
  .read()
  .notEmpty() // Return all non-empty lines of the file
```

#### Tap
```
tap(visit?: (item: T) => OrProm<any>): AsyncGenerator<T>
```

`tap` provides the ability to inspect the sequence without affecting it's production.  The function passed into to `tap` can produce a promise that will be waited on, if needed.

```javascript
'.csv'
  .async
  .dir()
  .tap(({stats}) => collectMetrics(stats)) 
  // Stream unchanged, but was able to track file stat information
```

#### Unique
```
unique(this: AsyncGenerator<T>, equal?: (a: T, b: T) => OrProm<boolean>): AsyncGenerator<T>
```

`unique` will ensure the output sequence does not have any consecutive duplicates, similar to the unix `uniq` command.  The uniqueness is only guaranteed linearly, to allow for streaming.  Otherwise this would need to wait for all data before proceeding.  You can also specify a custom equality function as needed.  

```javascript
[1, 2, 2, 3, 4, 5, 5, 1, 7]
  .async
  .unique() // Will produce [1, 2, 3, 4, 5, 1, 7]
  // The final 1 repeats as it's not duplicated in sequence 
```

#### Sort
```
sort(this: AsyncGenerator<T>, compare?: (a: T, b: T) => number): AsyncGenerator<T>
```

`sort` is a blocking operation as it requires all the data to be able to sort properly.  This means it will wait on the entire sequence before producing new data.  The function operates identically to how `Array.prototype.sort` behaves.

```javascript
'<file>'
  .async
  .read() // Now a sequence of lines
  .sort() // Sort lines alphabetically
  // Now a sequence of sorted lines
```

#### Batch
```
batch(size: number): AsyncGenerator<T[]>
```

`batch` allows for iterative grouping of streamed data, and produces a sequence of arrays.  Each array will be `batch` sized, except for the final array which will be at most `batch` size. 

```javascript
'<file>'
  .async
  .read() // Generator of file lines
  .batch(20) // Generator of array of lines, at most 20 items in length
  .map(lines => lines.sort()) // Sort each batch
  // Generator of sorted list strings
``` 

#### Pair
```
pair<U>(this: AsyncGenerator<T>, value: OrCall<OrGen<U>>, mode?: 'repeat' | 'exact' | 'empty'): AsyncGenerator<[T, U]>
```

`pair` allows for combining two sets of data into a single sequence of pairs.  The second value can either be a single value, which will be added to every item, or it could be an iterable element that will match with each item as possible. If the second iterator runs out, the remaining values can be affected by the mode parameter:
* * `'empty'`  - Fill in with `undefined` once the second iterator is exhausted.  This is default for iterable values.
* * `'repeat'` - Loop iteration on the secondary iterator.  This is default for string values.
* * `'exact'`  - Stop the emitting values once the secondary iterator is exhausted.

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
As text operators, these only apply to sequences that produce string values. 

#### Columns
```
columns(this: AsyncGenerator<string>, sep?: RegExp | string): AsyncGenerator<T[]>
```

`columns` is similar to the unix `awk` in that it allows for production of columns from a single line of text. This is useful for dealing with column oriented output.  The separator defaults to all whitespace but can tailored as needed by regex or string.

```javascript
'<file>.tsv' // Tab-separated file
  .async
  .read() // Read as lines
  .columns('\t') // Separate on tabs
  // Now an array of tuples (as defined by tabs in the tsv)

```

```
columns(this: AsyncGenerator<string>, names: string[], sep?: RegExp | string): AsyncGenerator<Record<string, string>>
```
Additionally, `columns` supports passing in column names to produce objects instead of tuples.  These values will be matched
with the columns produced by the separator.

```javascript
'<file>.tsv' // Tab-separated file
  .async
  .read() // Read as lines
  .columns(['Name', 'Age', 'Major'], '\t') // Separate on tabs
  // Now an array of objects { Name: string, Age: string, Major: string } (as defined by tabs in the tsv)

```

#### Tokens
```
tokens(this: AsyncGenerator<string>, sep?: RegExp | string): AsyncGenerator<T>
```

This operator allows for producing a single sequence of tokens out of lines of text.  The default separator is whitespace.

```javascript
'<file>'
  .async
  .read() // Read file as lines
  .tokens() // Convert to words 
  .filter(x => x.length > 5) // Retain only words 6-chars or longer
```

#### Match
```
match(this: AsyncGenerator<string>, regex: RegExp | string | RegexType, mode?: MatchMode): AsyncGenerator<string>
```

`match` is similar to tokens, but will emit based on a pattern instead of just word boundaries.  In addition to simple regex or string patterns, there is built in support for some common use cases (`RegexType`)
* `'URL'` - Will match on all URLs
* `'EMAIL'` - Will match on all emails

Additionally, mode will determine what is emitted when a match is found (within a single line)
* `undefined` - (default) Return entire line
* `'extract'` - Return only matched element
* `'negate'` - Return only lines that do not match 

```javascript
'<file>'
  .async
  .read()
  .match(/(FIXME|TODO)/, 'negate')  
  // Exclude all lines that include FIXME or TODO

'<file>'
  .async
  .read()
  .match(/\d{3}(-)?\d{3}(-)?\d{4}/, 'extract)  
  // Return all phone numbers in the sequence
```

#### Replace
```
replace(this: AsyncGenerator<string>, regex: RegExp | string, sub: string | Replacer): AsyncGenerator<string>
```

`replace` behaves identically to `String.prototype.replace`, but will only operate on a single sequence value at a time.

```javascript
'<file>'
  .async
  .read()
  .replace(/TODO/, 'FIXME')
  // All occurrences replaced
```

#### Trim
```
trim(this: AsyncGenerator<string>): AsyncGenerator<string>
```

`trim` behaves identically to `String.prototype.trim`, but will only operate on a single sequence value at a time.

```javascript
'<file>'
  .async
  .read()
  .trim() 
  // Cleans leading/trailing whitespace per line
```

#### Single Line
```
singleLine(this: AsyncGenerator<string>): AsyncGenerator<string>
```

```
singleLine
``` is a convenience method for converting an entire block of text into a single line.  This is useful when looking for patterns that may span multiple lines.

```javascript
'<file>.html'
  .async
  .read()
  .singleLine() // Convert to a single line
  .replace(/<[^>]+?>/) // Remove all HTML tags
```

#### Join
```
join(this: AsyncGenerator<string>, joiner?: string | ((a: string[]) => string): AsyncGenerator<string>
```

This operator allows for combining a sequence of strings into a single value similar to `String.prototype.join`. 

```javascript
'<file>'
  .async
  .read() // Read as a series of lines
  .join('\n') 
  // Produces a single value of the entire file
```

### Limit

#### First
```
first(n?: number): AsyncGenerator<T>
```

This will return the first `n` elements with a default of a single element.

```javascript
'<file>'
  .async
  .read()
  .first(10) // Read first 10 lines
```

#### Skip
```
skip(n: number): AsyncGenerator<T>
```

This will return all but the first `n` elements.

```javascript
'<file>.csv'
  .async
  .read()
  .skip(1) // Skip header
```

#### Last
```
last(n?: number): AsyncGenerator<T>
```

This will return the last `n` elements with a default of a single element.

```javascript
'<file>'
  .async
  .read()
  .last(7) // Read last 7 lines of file
```

#### Repeat
```
repeat(n?: number, iters?: number): AsyncGenerator<T>
```

This will repeat the first `n` elements with a default of all elements.

```javascript
'<file>'
  .async
  .read()
  .first(10) // Read first 10 lines
```

### Net

#### Fetch
```
fetch(this: AsyncGenerator<string>, output?: IOType, opts?: HttpOpts): AsyncGenerator<string | Buffer>
```

This is meant as a simple equivalent of `curl`.  Will fetch a single page (and follow redirects).  By default, it will return lines from the response. Optionally, can return the entire page as a single string, or a sequence of `Buffer`s depending on the output type.  

```javascript
```
https://en.wikipedia.org/wiki/Special:Random
```
  .async
  .fetch() // Request URL
  .match('URL', 'extract') // Pull out URLs
```

### Exec

#### Exec Each
```
execEach(cmd: string, ...args: string[]): AsyncGenerator<string>
```

Execute the command against each item in the sequence. Allow for a list of args to prepend to the command execution.  The command's stdout is returned as individual lines.

```javascript
'.ts'
  .async
  .dir() // Get all files
  .execEach('wc', '-l') // Execute word count for each line
```

#### Exec
```
exec(cmd: string, args?: string[], output?: IOType): AsyncGenerator<string>
```

Pipe the entire sequence as input into the command to be executed.  Allow for args to be prepended to the command as needed.  If the output is specified as 'binary', the sequence will return a sequence of Buffers, otherwise will return strings

```javascript
'.ts'
  .async
  .dir() // Get all files
  .read() // Read all files
  .exec('wc', ['-l']) // Execute word count for all files 
  // Run in a single operation
```

### Data

#### JSON
```
json<V = any>(this: AsyncGenerator<string>): AsyncGenerator<V>
```

Converts the inbound JSON string into JS Object by way of `JSON.parse`.  This will operate on individual values in the sequence, so each value should be a complete document.

```javascript
```
https://jsonplaceholder.typicode.com/todos/1
```
  .async
  .fetch() // request url
  .json()  // Convert from JSON
```

#### CSV
```
csv(this:AsyncGenerator<string>, columns?: string[]): AsyncGenerator<string[] | Record<V[number], string>>
```

Converts the inbound CSV string into JS Object.  Converts by using simple CSV support and splitting on commas.  Each value in the sequence is assumed to be a single row in the output.

```javascript
'<file>.csv'
  .async
  .read() // Read file
  .csv(['Name', 'Age', 'Major']) 
  // Convert to objects from CSV
```

#### Prompt
```
prompt<V = any>(this: AsyncGenerator<string>, password?: boolean): AsyncGenerator<V>
```

Will read string values from the input, delimited by new lines

```javascript
  'Enter a file name:'
    .async
    .prompt() // Request file name
    .read() // Read file
```

### Export

#### Stream
```
stream(this: AsyncGenerator<T>, mode?: IOType): NodeJS.ReadableStream
```

Converts a sequence into a node stream.  This readable stream should be considered standard, and usable in any place a stream is expected. The mode determines if the stream is string or `Buffer` oriented.

```javascript
const stream = '<file>.png'
  .async
  .read('binary') // Read file as binary
  .exec('convert', ['-size=100x20']) // Pipe to convert function
  .stream('binary') // Read converted output into NodeJS stream

stream.pipe(fs.createWriteStream('out.png')); // Write out

```

#### Write
```
write<U extends string | Buffer | any>(this: AsyncGenerator<U>, writable: Writer): Promise<void>
```

Emits the sequence contents to a write stream.  If the write stream is a string, it is considered to be a file name. Buffer contents are written as is.  String contents are written as lines.

```javascript
'<file>.png'
  .async
  .read('binary') // Read file as binary
  .exec('convert', ['-size=100x20']) // Pipe to convert function
  .write('out.png') // Write file out
```

#### Values
```
values: Promise<T[]>
```

Extract all sequence contents into a single array and return as a promise.

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
```
value: Promise<T>
```

* Extract first sequence element and return as a promise.

```javascript
const name = await 'What is your name?'
  .async
  .prompt() // Prompt for name
  .value  // Get single value
```

#### Stdout
```
stdout: void
```

Simple property that allows any sequence to be automatically written to stdout

```javascript
'<file>'
  .async
  .read() // Read file
  .map(line => line.length) // Convert each line to it's length
  .stdout // Pipe to stdout
```

#### Console
```
console: void;
```

Simple property that allows any sequence to be automatically called with `console.log`.

```javascript
'<file>'
  .async
  .read() // Read file
  .json()
  .console // Log out objects
```

## Creating a Custom Operator

In the process of using the tool, there may be a need for encapsulating common operations.  By default, `wrap` provides an easy path for re-using functionality, but it lacks the clarity of intent enjoyed by the built in operators.

```javascript
function reverse(stream) {
  return stream
    .collect() // Gather the entire sequence as an array
    .map(x => x.reverse()) // Reverse it 
    .flatten(); // Flatten it back into a single sequence
}

[1,2,3]
  .async
  .wrap(reverse)
```

The above example is more than sufficient, but would better as:

```javascript
[1,2,3]
  .async
  .reverse()
```

This can be achieved by leveraging the built-in utilities found in the `util/register` utility class.

**Simple registration script**
```javascript
import {RegisterUtil} from '@arcsine/nodeshell';

function reverse() {
  return this
    .collect() // Gather the entire sequence as an array
    .map(x => x.reverse()) // Reverse it 
    .flatten(); // Flatten it back into a single sequence
}

RegisterUtil.operators({
  reverse
});
```

**Using Custom Operator**
```javascript
require('./register');

[1,2,3]
  .async
  .reverse() // Reverse is now available

```

