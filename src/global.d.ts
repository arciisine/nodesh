import { GlobalHelpers } from './helper';

import { CoreOperators } from './operator/core';
import { ExecOperators } from './operator/exec';
import { DataOperators } from './operator/data';
import { ExportOperators, ExportPropOperators } from './operator/export';
import { FileOperators } from './operator/file';
import { TextOperators } from './operator/text';
import { LimitOperators } from './operator/limit';
import { NetOperators } from './operator/net';
import { TimeOperators } from './operator/time';
import { TransformOperators } from './operator/transform';
import { AsyncAware, PARENT } from './types';

declare module 'fs' {
  interface ReadStream extends AsyncAware<string> { }
}

declare module 'stream' {
  namespace ReadableConstructor {
    const $: AsyncGenerator<string>;
  }
}

declare global {
  namespace globalThis {
    const of: GlobalHelpers['of'];
    const stdin: GlobalHelpers['stdin'];
    const registerOperator: GlobalHelpers['registerOperator'];
    const argv: GlobalHelpers['argv'];
    const env: GlobalHelpers['env'];
    const range: GlobalHelpers['range'];
  }
  interface AsyncGenerator<T = unknown, TReturn = any, TNext = unknown>
    extends
    CoreOperators,
    DataOperators,
    ExecOperators,
    ExportOperators,
    ExportPropOperators<T>,
    FileOperators,
    TextOperators,
    LimitOperators,
    NetOperators,
    TimeOperators,
    Promise<T[]>,
    TransformOperators,
    AsyncAware<T> {
    [PARENT]?: AsyncGenerator<T, TReturn, TNext>;
  }

  interface Generator<T> extends AsyncAware<T> { }
  interface Array<T> extends AsyncAware<T> { }
  interface String extends AsyncAware<string> { }
  interface Number extends AsyncAware<number> { }
  interface Boolean extends AsyncAware<boolean> { }
  interface RegExp extends AsyncAware<RegExp> { }
  interface Set<T> extends AsyncAware<T> { }
  interface Map<K, V> extends AsyncAware<[K, V]> { }
  namespace NodeJS {
    interface ReadStream extends AsyncAware<string> { }
  }
}
