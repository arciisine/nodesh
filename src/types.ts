export const { constructor: AsyncGeneratorCons } = ((async function* () { })());
export const { constructor: GeneratorCons } = ((function* () { })());

export type $AsyncIterable<T> = AsyncIterable<T> & Promise<T[]>;
export type Callable<X> = (...args: any[]) => X;
export type AsyncStream<X> = Iterable<X> | AsyncIterable<X>;
export type IOType = 'text' | 'line' | 'binary';

export type PromFunc<T, U> = (item: T) => U | Promise<U>;
export type PromFunc2<A, B, U> = (a: A, b: B) => U | Promise<U>;
export type OrCallable<X> = X | Callable<X>;
export type OrAsyncStream<X> = X | AsyncStream<X>;