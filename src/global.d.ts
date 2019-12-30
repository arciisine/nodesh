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
import { Asyncable } from './types';

declare module 'fs' {
  interface ReadStream extends Asyncable<string> { }
}

declare module 'stream' {
  namespace ReadableConstructor {
    const async: AsyncGenerator<string>;
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
    Asyncable<T> { }

  interface Generator<T> extends Asyncable<T> { }
  interface Array<T> extends Asyncable<T> { }
  interface String extends Asyncable<string> { }
  interface Number extends Asyncable<number> { }
  interface Boolean extends Asyncable<boolean> { }
  interface RegExp extends Asyncable<RegExp> { }
  interface Set<T> extends Asyncable<T> { }
  interface Map<K, V> extends Asyncable<[K, V]> { }
  namespace NodeJS {
    interface ReadStream extends Asyncable<string> { }
  }
}
