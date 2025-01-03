import { AutoSolveExpandedResultStepsTo } from "../types/expanded-result.js";
import { indent, stringifyMinMax } from "~/test/helpers/print-helpers.js";

export function printPatternSummary(
  lines: string[],
  slotPrintedCalculation: string[],
  indentAmount = 2
) {
  lines.push(indent(indentAmount) + slotPrintedCalculation.join(" "));
}

export function printCalculation(
  min: AutoSolveExpandedResultStepsTo,
  max: AutoSolveExpandedResultStepsTo
) {
  return [
    stringifyMinMax("T", { min: min.UncoverAll, max: max.UncoverAll }),
    stringifyMinMax("t", {
      min: min.FoundAll,
      max: max.FoundAll,
    }),
    stringifyMinMax("s", {
      min: min.FoundSword,
      max: max.FoundSword,
    }),
    stringifyMinMax("p", {
      min: min.FoundPresent,
      max: max.FoundPresent,
    }),
    stringifyMinMax("S", {
      min: min.UncoverSword,
      max: max.UncoverSword,
    }),
    stringifyMinMax("P", {
      min: min.UncoverPresent,
      max: max.UncoverPresent,
    }),
    stringifyMinMax("SP", {
      min: min.UncoverSwordPresent,
      max: max.UncoverSwordPresent,
    }),
    stringifyMinMax("F", { min: min.UncoverFox, max: max.UncoverFox }),
    stringifyMinMax("SF", {
      min: min.UncoverSwordFox,
      max: max.UncoverSwordFox,
    }),
    stringifyMinMax("PF", {
      min: min.UncoverPresentFox,
      max: max.UncoverPresentFox,
    }),
  ];
}
