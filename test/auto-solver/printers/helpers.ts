import { CommunityDataPattern } from "~/src/game/types/community-data.js";

export function stringifyMinMax(
  prefix: string,
  { min, max }: { min: number; max: number }
) {
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
export const DELIMINATOR = ";";

export function patternToPictograph(pattern: CommunityDataPattern) {
  return `${pattern.Sword3x2 ? "▭" : "▯"}${pattern.Sword} ◻${pattern.Present}`;
}
