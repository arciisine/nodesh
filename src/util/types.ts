export type OrProm<X> = X | Promise<X>;
export type OrStr<X> = string | X;
export type OrCall<X> = X | (() => X);
export type OrGen<X> = X | Iterable<X> | AsyncIterable<X> | AsyncGenerator<X>;
export type Gen<U> = OrProm<Iterator<U> | AsyncGenerator<U>>;
export type Reducer<U, T> = (acc: U, item: T) => OrProm<U>;
