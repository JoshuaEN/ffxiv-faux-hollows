export function* eachIndex<T>(array: T[]): Iterable<[number, T]> {
  for (let i = 0; i < array.length; i++) {
    yield [i, array[i] as T];
  }
}

// https://stackoverflow.com/a/69370003
type Indices<L extends number, T extends number[] = []> = T["length"] extends L
  ? T[number]
  : Indices<L, [T["length"], ...T]>;

// https://stackoverflow.com/a/69370003
type LengthAtLeast<T extends ArrayLike<unknown>, L extends number> = T &
  Pick<Required<T>, Indices<L>>;

// https://stackoverflow.com/a/69370003
export function lengthAtLeast<T extends ArrayLike<unknown>, L extends number>(
  arr: T,
  len: L
): arr is T & LengthAtLeast<T, L> {
  return arr.length >= len;
}

export function assertLengthAtLeast<
  T extends ArrayLike<unknown>,
  L extends number,
>(arr: T, len: L): asserts arr is T & LengthAtLeast<T, L> {
  if (!lengthAtLeast(arr, len)) {
    throw new Error(
      `Length of array is not at least ${len} (was ${arr.length})`
    );
  }
}

// https://stackoverflow.com/a/69370003
export function lengthEquals<T extends ArrayLike<unknown>, L extends number>(
  arr: T,
  len: L
): arr is T & LengthAtLeast<T, L> {
  return arr.length === len;
}

export function assertNever(value: never): never {
  throw new Error(`Value ${value as string} is not never`);
}
export function assertUnreachable(): never {
  throw new Error(`Unreachable code reached`);
}

export function assert(value: boolean, message?: string): asserts value {
  if (value) {
    return;
  }
  throw new Error(
    `Assertion failed, given value is not true (received ${value})${
      message !== undefined ? message : ""
    }`
  );
}

export function assertEqual<T>(
  valueA: unknown,
  valueB: T,
  message?: string | (() => string)
): asserts valueA is T {
  if (valueA === valueB) {
    return;
  }
  throw new Error(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `Assertion failed, given values are not equal (received ${valueA} and ${valueB})${message !== undefined ? (typeof message === "function" ? message() : message) : ""}`
  );
}

export function assertDefined<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (value !== null && value !== undefined) {
    return;
  }
  throw new Error(
    `Assertion failed, given value is not defined (received ${value === null ? "null" : "undefined"})${message ?? ""}`
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unnecessary-type-parameters
export function assertType<T>(_value: T): void {}
