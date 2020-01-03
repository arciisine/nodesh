export type $AsyncIterable<T> = AsyncIterable<T> & Promise<T[]>;
export type IOType = 'text' | 'line' | 'binary';

export type PromFunc<T, U> = (item: T) => U | Promise<U>;
export type PromFunc2<A, B, U> = (a: A, b: B) => U | Promise<U>;
export type OrCallable<X> = X | (() => X);