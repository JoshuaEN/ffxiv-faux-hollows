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
       * The minimum and maximum overall to fully solve (all columns are from the same solve)
       */
      min: AutoSolveExpandedResultStepsTo;
      max: AutoSolveExpandedResultStepsTo;
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
        min: { ...summary.stepsTo },
        max: { ...summary.stepsTo },
        minInSlot: { ...summary.stepsTo },
        maxInSlot: { ...summary.stepsTo },
      };

      if (group.min.fullTotal > summary.stepsTo.fullTotal) {
        group.min = { ...summary.stepsTo };
      }
      if (group.max.fullTotal < summary.stepsTo.fullTotal) {
        group.max = { ...summary.stepsTo };
      }
      for (const key of Object.keys(
        summary.stepsTo
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

      groups.set(key, group);
    }

    for (const [patternKey, values] of Array.from(groups.entries()).sort(
      ([a], [b]) => b.localeCompare(a)
    )) {
      const overallPrintedCalculation = printCalculation(
        values.min,
        values.max
      );
      const perRowPrintedCalculation = printCalculation(
        values.minInSlot,
        values.maxInSlot
      );

      lines.push(`${indent(1)}${patternKey}`);
      const indexPadding: number[] = [];
      let allMatch = true;
      for (let i = 0; i < overallPrintedCalculation.length; i++) {
        const totalValue = overallPrintedCalculation[i];
        const perRowValue = perRowPrintedCalculation[i];
        assertDefined(totalValue);
        assertDefined(perRowValue);

        if (allMatch && totalValue !== perRowValue) {
          allMatch = false;
        }
        indexPadding.push(Math.max(totalValue.length, perRowValue.length));
      }
      if (allMatch) {
        lines.push(overallPrintedCalculation.join(" "));
      } else {
        lines.push(
          `${overallPrintedCalculation.map((value, index) => value.padEnd(indexPadding[index] ?? 0)).join(" ")}${indent(1)}(overall best/worse)`
        );
        lines.push(
          `${perRowPrintedCalculation.map((value, index) => value.padEnd(indexPadding[index] ?? 0)).join(" ")}${indent(1)}(per-row best/worse; each column may be from a different solve)`
        );
      }
    }
  }
}
function printCalculation(
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
