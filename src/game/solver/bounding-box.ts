import { cordToIndex, indexToCord } from "../helpers.js";
import { CommunityDataPattern } from "../types/community-data.js";
import { TileState } from "../types/tile-states.js";

export interface BoundingBoxArea {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export class BoundingBox implements BoundingBoxArea {
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

  contains(other: number | BoundingBoxArea | null) {
    if (other === null) {
      return false;
    }
    if (typeof other === "number") {
      other = {
        ...indexToCord(other),
        height: 1,
        width: 1,
      };
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

  static fromPoints(
    minPoint: { x: number; y: number },
    maxPoint: { x: number; y: number }
  ): BoundingBox {
    return BoundingBox.fromXYs(minPoint.x, minPoint.y, maxPoint.x, maxPoint.y);
  }
  static fromXYs(
    minPointX: number,
    minPointY: number,
    maxPointX: number,
    maxPointY: number
  ) {
    return new BoundingBox(
      minPointX,
      minPointY,
      maxPointX - minPointX + 1,
      maxPointY - minPointY + 1
    );
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

  return BoundingBox.fromXYs(minX, minY, maxX, maxY);
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
