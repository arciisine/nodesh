# Node Shell
Node shell is an npm package aimed at providing bash-like operations/simplicity within the node ecosystem.  The goal is to make working with files/folders, http requests, and transformations, as as easy as possible.  The library is built upon the async generation constructs within Ecmascript as well as stream constructs within the node ecosystem.  This means the performance is iterative and real-time, just in the same way piping works in a Unix shell.

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

**NOTE:** The shebang defined here is using `env`'s `-S` flag which will allow for the passing of arguments in the shebang.

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

#### $registerOperator

In the process of using the tool, there may be a need for encapsulating common
operations.  By default, `$wrap` provides an easy path for re-using functionality,
but it lacks the clarity of intent enjoyed by the built in operators.

```typescript
static get $registerOperator(): (op: Function) => void;
```
Example
```javascript
 (reverse.js)
class Custom {
  $reverse() {
    return this
      .$collect() // Gather the entire sequence as an array
      .$map(x => x.reverse()) // Reverse it
      .$flatten(); // Flatten it back into a single sequence
  }
}

registerOperator(Custom);

module global { // Typescript only
  interface AsyncIterable<T> extends Custom;
}

```

```javascript
require('./reverse')

[1,2,3]
  .$iterable
  .$reverse() // Reverse is now available

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
URL: RegExp;EMAIL: RegExp;};
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


### Core

The core functionality provides some very basic support for sequences



#### $forEach

This operator is a terminal action that receives each element of the sequence in sequence,
but returns no value.  This function produces a promise that should be waited on to ensure the
sequence is exhausted.
```typescript
$forEach<T>(this: AsyncIterable<T>, fn: PromFunc<T, any>): Promise<void>;
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
