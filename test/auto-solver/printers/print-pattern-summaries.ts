import {
  AutoSolveExpandedResult,
  AutoSolveExpandedResultStepsTo,
} from "../generate-summaries.js";
import { indent, patternToPictograph, stringifyMinMax } from "./helpers.js";

export function printPatternSummaries(
  lines: string[],
  summaries: AutoSolveExpandedResult[]
) {
  {
    type GroupValues = {
      /**
       * The minimum and maximum steps for this specific slot (the column, e.g. Present, Present+Fox, Sword, Sword+Present, etc...)
       * Each column may be from a different solve.
       */
      minInSlot: AutoSolveExpandedResultStepsTo;
      maxInSlot: AutoSolveExpandedResultStepsTo;
    };
    const groups = new Map<string, GroupValues>();
    for (const summary of summaries) {
      const key = `${summary.identifier} ${patternToPictograph(summary.pattern)}`;

      const group: GroupValues = groups.get(key) ?? {
        minInSlot: { ...summary.stepsTo },
        maxInSlot: { ...summary.stepsTo },
      };

      for (const key of Object.keys(
        summary.stepsTo
      ) as (keyof AutoSolveExpandedResultStepsTo)[]) {
        const newValue = summary.stepsTo[key];
        const currentMin = group.minInSlot[key];
        const currentMax = group.maxInSlot[key];

        if (currentMin > newValue) {
          group.minInSlot[key] = newValue;
        }
        if (currentMax < newValue) {
          group.maxInSlot[key] = newValue;
        }
      }

      groups.set(key, group);
    }

    for (const [patternKey, values] of Array.from(groups.entries()).sort(
      ([a], [b]) => b.localeCompare(a)
    )) {
      const slotPrintedCalculation = printCalculation(
        values.minInSlot,
        values.maxInSlot
      );

      lines.push(`${indent(1)}${patternKey}`);
      printPatternSummary(lines, slotPrintedCalculation);
    }
  }
}

export function printPatternSummary(
  lines: string[],
  slotPrintedCalculation: string[]
) {
  lines.push(slotPrintedCalculation.join(" "));
}

export function printCalculation(
  min: AutoSolveExpandedResultStepsTo,
  max: AutoSolveExpandedResultStepsTo
) {
  return [
    indent(2),
    stringifyMinMax("T", { min: min.UncoverAll, max: max.UncoverAll }),
    stringifyMinMax("t", {
      min: min.totalSteps,
      max: max.totalSteps,
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
