import { GlobalHelpers } from './helper';
import { $AsyncIterable } from './types';

import { CoreOperators } from './operator/core';
import { AdvancedOperators } from './operator/advanced';
import { ExecOperators } from './operator/exec';
import { DataOperators } from './operator/data';
import { ExportOperators, ExportPropOperators } from './operator/export';
import { FileOperators } from './operator/file';
import { TextOperators } from './operator/text';
import { LimitOperators } from './operator/limit';
import { NetOperators } from './operator/net';
import { TimeOperators } from './operator/time';
import { TransformOperators } from './operator/transform';

type GHStatic = typeof GlobalHelpers;

type AllOps<T> =
  FileOperators &
  TextOperators &
  NetOperators &
  DataOperators &
  ExecOperators &
  CoreOperators &
  ExportOperators &
  ExportPropOperators<T> &
  LimitOperators &
  TimeOperators &
  TransformOperators &
  AdvancedOperators &
  { $iterable: $AsyncIterable<T> };

declare global {
  namespace globalThis {
    const $of: GHStatic['$of'];
    const $stdin: GHStatic['$stdin'];
    const $registerOperator: GHStatic['$registerOperator'];
    const $argv: GHStatic['$argv'];
    const $env: GHStatic['$env'];
    const $pattern: GHStatic['$pattern'];
    const $range: GHStatic['$range'];
  }

  interface AsyncGenerator<T = unknown, TReturn = any, TNext = unknown> extends AllOps<T>, Promise<T[]> { }

  interface AsyncIterable<T> extends AllOps<T> { }
  interface Buffer extends AsyncIterable<Buffer> { }
  interface String extends AsyncIterable<string> { }
  interface Number extends AsyncIterable<number> { }
  interface Boolean extends AsyncIterable<boolean> { }
  interface RegExp extends AsyncIterable<RegExp> { }
  interface Array<T> extends AsyncIterable<T> { }
  interface Set<T> extends AsyncIterable<T> { }
  interface Generator<T> extends AsyncIterable<T> { }
  interface Map<K, V> extends AsyncIterable<[K, V]> { }
  interface URLSearchParams extends AsyncIterable<[string, string]> { }

  namespace NodeJS {
    interface ReadStream extends Omit<AsyncIterable<string>, 'asyncIterator'> { }
  }
}

declare module 'fs' {
  interface ReadStream extends Omit<AsyncIterable<string>, 'asyncIterator'> { }
}

declare module 'http' {
  interface ClientRequest extends Omit<AsyncIterable<string>, 'asyncIterator'> { }
  interface IncomingMessage extends Omit<AsyncIterable<string>, 'asyncIterator'> { }
}
