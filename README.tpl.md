# Node Shell
Node shell is an npm package aimed at providing bash-like operations/simplicity within the node ecosystem.  The goal is to make working with files/folders, http requests, and transformations, as as easy as possible.  The library is built upon the async generation constructs within Ecmascript as well as stream constructs within the node ecosystem.  This means the performance is iterative and real-time, just in the same way piping works in a Unix shell.

**(remote-tokens.js) Example of processing URLs from the input stream** 

```javascript
#!/usr/bin/env -S npx @arcsine/nodesh

$stdin // Automatically pipe from stdin
  .$match('URL', 'extract')  // Retain only URL patterns and emit as single values
  .$fetch() // Request each url that comes through
  .$tokens(/[^A-Za-z0-9_]+/) // Break down returned webpage into tokens
  .$trim() 
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
* `NodeJS:ReadStream` - This will return a line-oriented async generator over the read stream

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

In addition to the built-in functionality, a global function `$of` is declared that will allow any value passed in to be converted to an async iterable.  If the item is iterable or is a stream, it will return the iteration as a generator, otherwise return the value as a single-valued generator.

**Example of simple value**
```typescript
const bigIntGen = $of(10000n);
```

%%HELPERS%%

## Operators
The entirety of this project centers on the set of available operators.  These operators can be broken into the following groups

%%OPERATORS%%