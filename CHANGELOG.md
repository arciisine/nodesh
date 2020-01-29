Changelog
-----------------------------

## 1.7.0
* Support reading text files with filename/line number context
* Support contextual lines for $match, before/after lines.
* Changed some signature to support objects, future proofing more complex configs

## 1.6.2
* Added in gzip/gunzip support
* Supports glob patterns in file matching
* General improvements

## 1.5.0
* $tokens extracts now by pattern, vs separator.

## 1.4.1
* Fixing support for Node 10

## 1.4.0
* Adding in concat operator.  Supporting count flag for unique operator.

## 1.3.0
* Standardize stream input/output, with newline support.  Ensuring consistency with POSIX definition of lines.
* Cleanup of streaming emissions.

## 1.2.2
* Support for raw streams for exec and http

## 1.2.0
* Enhanced HTTP support, now allows for streaming data as request payload.

## 1.1.7
* Support key/value map for replace operator
* Patterns from replace have been externalized out to $pattern

## 1.1.6
* Wait for streams to finish by use of setTimeout

## 1.1.5
* Minify output appropriately

## 1.1.0
* Removed need for `.async`.  expose operators directly on Object.prototype