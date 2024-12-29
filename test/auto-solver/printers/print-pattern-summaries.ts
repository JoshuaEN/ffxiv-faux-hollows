import { TileState } from "~/src/game/types/index.js";
import {
  AutoSolveExpandedResult,
  AutoSolveExpandedResultStepsTo,
} from "../generate-summaries.js";
import { indent, patternToPictograph, stringifyMinMax } from "./helpers.js";
import { assertDefined } from "~/src/helpers.js";

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

      for (const key of Object.keys(summary.stepsTo).filter(
        (k) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
          k !== TileState.Sword &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
          k !== TileState.Present &&
          k !== "swordFullSteps" &&
          k !== "presentFullSteps"
      ) as (keyof typeof summary.stepsTo)[]) {
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

      stableSwordPresentSteps(
        summary,
        group.maxInSlot,
        "Sword",
        "sword",
        (a, b) => a > b
      );
      stableSwordPresentSteps(
        summary,
        group.minInSlot,
        "Sword",
        "sword",
        (a, b) => a < b
      );
      stableSwordPresentSteps(
        summary,
        group.maxInSlot,
        "Present",
        "present",
        (a, b) => a > b
      );
      stableSwordPresentSteps(
        summary,
        group.minInSlot,
        "Present",
        "present",
        (a, b) => a < b
      );

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

/**
 * Because s2+5 === s1+6 (for example), the actual result may not be stable if we only compare shape + shapeFullSteps
 * So we tiebreak so we always return the same result regardless of the other these are processed in, other things equal.
 */
function stableSwordPresentSteps(
  summary: AutoSolveExpandedResult,
  stepsTo: AutoSolveExpandedResultStepsTo,
  shape: "Sword" | "Present",
  shapeFullSteps: "sword" | "present",
  cmp: (a: number, b: number) => boolean
) {
  const tiebreakNeeded =
    summary.stepsTo[shape] + summary.stepsTo[`${shapeFullSteps}FullSteps`] ===
    stepsTo[shape] + stepsTo[`${shapeFullSteps}FullSteps`];
  const setBySimpleCompare = cmp(
    summary.stepsTo[shape] + summary.stepsTo[`${shapeFullSteps}FullSteps`],
    stepsTo[shape] + stepsTo[`${shapeFullSteps}FullSteps`]
  );
  const setByShapeTiebreak =
    tiebreakNeeded && cmp(summary.stepsTo[shape], stepsTo[shape]);
  const setByFullStepsTiebreak =
    tiebreakNeeded &&
    summary.stepsTo[shape] === stepsTo[shape] &&
    cmp(
      summary.stepsTo[`${shapeFullSteps}FullSteps`],
      stepsTo[`${shapeFullSteps}FullSteps`]
    );
  if (setBySimpleCompare || setByShapeTiebreak || setByFullStepsTiebreak) {
    stepsTo[shape] = summary.stepsTo[shape];
    stepsTo[`${shapeFullSteps}FullSteps`] =
      summary.stepsTo[`${shapeFullSteps}FullSteps`];
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
    stringifyMinMax("T", { min: min.fullTotal, max: max.fullTotal }),
    stringifyMinMax("t", {
      min: min.totalSteps,
      max: max.totalSteps,
    }),
    stringifyMinMax("s", {
      min: min[TileState.Sword],
      max: max[TileState.Sword],
    }) +
      stringifyMinMax("+", {
        min: min.swordFullSteps,
        max: max.swordFullSteps,
      }),
    stringifyMinMax("p", {
      min: min[TileState.Present],
      max: max[TileState.Present],
    }) +
      stringifyMinMax("+", {
        min: min.presentFullSteps,
        max: max.presentFullSteps,
      }),
    stringifyMinMax("SP", {
      min: min.fullSwordPresent,
      max: max.fullSwordPresent,
    }),
    stringifyMinMax("F", { min: min.bestFox, max: max.bestFox }),
    stringifyMinMax("SF", {
      min: min.bestSwordFox,
      max: max.bestSwordFox,
    }),
    stringifyMinMax("PF", {
      min: min.bestPresentFox,
      max: max.bestPresentFox,
    }),
  ];
}
