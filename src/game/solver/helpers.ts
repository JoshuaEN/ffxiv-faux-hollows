import { indexToCord } from "../helpers";

export class BoundingBox {
  readonly shortSide: number;
  readonly longSide: number;
  constructor(
    readonly x: number,
    readonly y: number,
    readonly width: number,
    readonly height: number
  ) {
    if (width < height) {
      this.shortSide = width;
      this.longSide = height;
    } else {
      this.shortSide = height;
      this.longSide = width;
    }
  }
}

export function getBoundingBox(
  indexes: ReadonlySet<number>
): BoundingBox | null {
  if (indexes.size < 1) {
    return null;
  }
  let minX = Number.MAX_SAFE_INTEGER,
    minY = Number.MAX_SAFE_INTEGER,
    maxX = 0,
    maxY = 0;
  for (const index of indexes) {
    const { x, y } = indexToCord(index);

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);

    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return new BoundingBox(minX, minY, maxX - minX + 1, maxY - minY + 1);
}
