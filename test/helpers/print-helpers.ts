import { CommunityDataPattern } from "~/src/game/types/community-data.js";
import { assert, assertDefined } from "~/src/helpers.js";

export function stringifyMinMax(
  prefix: string,
  { min, max }: { min: number; max: number }
) {
  if (min === Number.MIN_SAFE_INTEGER || max === Number.MAX_SAFE_INTEGER) {
    if (min === Number.MIN_SAFE_INTEGER && max === Number.MAX_SAFE_INTEGER) {
      return `${prefix}∅`;
    }
    throw new Error(
      `Attempted to stringify min/max with values ${min}, ${max} ; either both of these should be MIN/MAX_SAFE_INTEGER or neither`
    );
  }
  return min === max ? `${prefix}${min}` : `${prefix}[${min},${max}]`;
}

export function indent(level: number) {
  return " ".repeat(level * 2);
}

export const formatter = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 3,
  minimumFractionDigits: 3,
});
export const formatter1Place = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});
export const formatterPercent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function patternToPictograph(pattern: CommunityDataPattern) {
  return `${pattern.Sword3x2 ? "▭" : "▯"}${pattern.Sword} ◻${pattern.Present}`;
}

export function getStandardDeviation(array: number[]) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
}

export function getMedian(array: number[]) {
  array = [...array].sort();
  const halfWayIndex = Math.floor(array.length / 2);
  const halfWayValue = array[halfWayIndex];
  assertDefined(halfWayValue);
  if (array.length % 2 === 0) {
    const halfWayMinus1Value = array[halfWayIndex - 1];
    assert(halfWayMinus1Value !== undefined);
    return (halfWayMinus1Value + halfWayValue) / 2;
  } else {
    return halfWayValue;
  }
}
