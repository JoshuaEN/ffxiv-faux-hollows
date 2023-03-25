import { BOARD_CELLS, BOARD_HEIGHT } from "./constants.js";

export function cordToIndex(x: number, y: number) {
  if (x < 0) {
    throw new Error(`x (${x}) is less than 0`);
  }
  if (y < 0) {
    throw new Error(`y (${y}) is less than 0`);
  }
  return x + BOARD_HEIGHT * y;
}
export function indexToCord(index: number) {
  if (index < 0) {
    throw new Error(`index (${index}) is less than 0`);
  }
  if (index >= BOARD_CELLS) {
    throw new Error(
      `index (${index}) is greater than or equal to ${BOARD_CELLS}`
    );
  }
  const x = index % BOARD_HEIGHT;
  const y = Math.floor(index / BOARD_HEIGHT);
  return { x, y };
}

export function hash(indexes: Iterable<number>) {
  return (
    (Array.isArray(indexes) ? indexes.slice() : Array.from(indexes))
      // Sorting guarantees a consistent hash is generated for the same set of indexes
      .sort((a, b) => a - b)
      .join(",")
  );
}
