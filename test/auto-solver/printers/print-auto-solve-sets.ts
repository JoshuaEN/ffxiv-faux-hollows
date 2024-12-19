import { assert } from "~/src/helpers.js";
import { expandedStepsTo } from "../expanded-steps-to.js";
import { indent, patternToPictograph, stringifyMinMax } from "./helpers.js";
import {
  AutoSolveIdentifierSet,
  AutoSolveResult,
  AutoSolveResultStepTaken,
} from "../auto-solver.js";
import { TileState } from "~/src/game/types/tile-states.js";

export function printAutoSolveSets(
  lines: string[],
  results: Record<string, AutoSolveIdentifierSet>
) {
  for (const [identifier, set] of Object.entries(results).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    lines.push(
      `${indent(1)}${identifier} | Blocked: ${set.blocked.join(", ")}`
    );
    lines.push("");
    for (const item of set.patternResults) {
      lines.push(`${indent(2)}${patternToPictograph(item.pattern)}`);
      let foxIndex = -1;
      let initialSet: AutoSolveResult | null = null;
      for (const result of item.solveResults.sort(
        (a, b) => a.foxIndex - b.foxIndex
      )) {
        if (foxIndex !== result.foxIndex) {
          foxIndex = result.foxIndex;
          initialSet = result;
          lines.push(`${indent(3)} Fox at ${result.foxIndex}`);
        } else {
          if (
            !(
              initialSet !== null &&
              initialSet.stepsTo.totalSteps.min ===
                result.stepsTo.totalSteps.min &&
              initialSet.stepsTo.totalSteps.max ===
                result.stepsTo.totalSteps.max &&
              initialSet.stepsTo.Fox.min === result.stepsTo.Fox.min &&
              initialSet.stepsTo.Fox.max === result.stepsTo.Fox.max &&
              initialSet.stepsTo.Present === result.stepsTo.Present &&
              initialSet.stepsTo.Sword === result.stepsTo.Sword
            )
          ) {
            lines.push(`${indent(4)} <PATTERN BREAK>`);
            initialSet = result;
          }
        }

        {
          const {
            bestFoxSteps,
            bestPresentFoxSteps,
            bestSwordFoxSteps,
            bestTotalSteps,
            swordFullSteps,
            presentFullSteps,
          } = expandedStepsTo(result.stepsTo, result.steps);

          assert(
            bestTotalSteps.min ===
              Math.max(
                result.stepsTo.Sword,
                result.stepsTo.Present,
                result.stepsTo.Fox.min
              ) +
                swordFullSteps +
                presentFullSteps
          );
          assert(
            bestTotalSteps.max ===
              Math.max(
                result.stepsTo.Sword,
                result.stepsTo.Present,
                result.stepsTo.Fox.max
              ) +
                swordFullSteps +
                presentFullSteps
          );

          lines.push(
            [
              indent(4),
              stringifyMinMax("T", bestTotalSteps),
              stringifyMinMax("t", result.stepsTo.totalSteps),
              `s${result.stepsTo[TileState.Sword]}+${swordFullSteps}`,
              `p${result.stepsTo[TileState.Present]}+${presentFullSteps}`,
              `SP${Math.max(result.stepsTo[TileState.Sword], result.stepsTo[TileState.Present]) + swordFullSteps + presentFullSteps}`,
              // stringifyMinMax("F", result.stepsTo[TileState.Fox]),
              stringifyMinMax("F", bestFoxSteps),
              stringifyMinMax("SF", bestSwordFoxSteps),
              stringifyMinMax("PF", bestPresentFoxSteps),
              // stringifyMinMax("bF", bestFoxSteps),
              `| ->`,
              printSteps(result.steps),
            ].join(" ")
          );
        }
      }
    }
  }
}

export function printSteps(steps: AutoSolveResultStepTaken[]) {
  return steps.map((step) => `${step.index}->${step.state[0]}`).join(", ");
}
