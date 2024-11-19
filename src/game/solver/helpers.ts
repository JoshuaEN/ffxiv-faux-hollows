import { cordToIndex, indexToCord } from "../helpers.js";
import { CommunityDataPattern } from "../types/community-data.js";
import { TileState } from "../types/tile-states.js";

export class BoundingBox {
  readonly shortSide: number;
  readonly longSide: number;
  #indexes: number[] | undefined;
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

  contains(other: BoundingBox | null) {
    if (other === null) {
      return false;
    }
    return (
      this.x <= other.x &&
      this.x + this.width >= other.x + other.width &&
      this.y <= other.y &&
      this.y + this.height >= other.y + other.height
    );
  }

  indexes() {
    if (this.#indexes === undefined) {
      const cords: number[] = [];
      for (let y = this.y; y < this.y + this.height; y++) {
        for (let x = this.x; x < this.x + this.width; x++) {
          cords.push(cordToIndex(x, y));
        }
      }
      this.#indexes = cords;
    }
    return this.#indexes;
  }
}

export function getBoundingBox(
  indexes: ReadonlySet<number> | readonly number[]
): BoundingBox | null {
  if (
    (indexes instanceof Set
      ? indexes.size
      : Array.isArray(indexes)
        ? indexes.length
        : 0) < 1
  ) {
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

export function getCommunityDataPatternBoundingBox(
  pattern: CommunityDataPattern,
  state: TileState.Sword | TileState.Present
) {
  const { x, y } = indexToCord(pattern[state]);
  return new BoundingBox(
    x,
    y,
    state === TileState.Sword && pattern.Sword3x2 ? 3 : 2,
    state === TileState.Sword && !pattern.Sword3x2 ? 3 : 2
  );
}
