import { communityDataByIdentifier } from "~/src/game/generated-community-data";
import { TileState } from "~/src/game/types";
import { assertDefined, assertEqual } from "~/src/helpers";
import {
  patternToPictograph,
  indent,
  stringifyMinMax,
} from "~/test/helpers/print-helpers";
import { AutoSolverCollapsedPossibilities } from "../types/collapsed-possibilities.js";
import { isFoxCandidatesShownOrFoxFound } from "../helpers/fox-status.js";
import { generateRollups } from "../helpers/generate-rollups.js";
import {
  ExtendedAutoSolveStrategyResult,
  AutoSolveStep,
} from "../types/solve-result.js";
import {
  STRATEGY_All,
  STRATEGY_Fox,
  STRATEGY_SwordPresent,
  STRATEGY_SwordFox,
  STRATEGY_PresentFox,
} from "../types/strategies.js";
import {
  printCalculation,
  printPatternSummary,
} from "./print-pattern-summaries.js";

export function printShortCircuitSolveResults(
  lines: string[],
  collapsedPossibilities: AutoSolverCollapsedPossibilities
) {
  let lastIdentifier = "";
  for (const [pattern, items] of Array.from(
    collapsedPossibilities.entries()
  ).sort(([a, aI], [b, bI]) => {
    const aId = aI.All[0];
    const bId = bI.All[0];
    assertDefined(aId);
    assertDefined(bId);
    const identifierCmp = aId.identifier.localeCompare(bId.identifier);
    if (identifierCmp !== 0) {
      return identifierCmp;
    }
    return patternToPictograph(a).localeCompare(patternToPictograph(b));
  })) {
    const firstItem = items.All[0];
    assertDefined(firstItem);
    const blocked = communityDataByIdentifier[firstItem.identifier].Blocked;

    if (lastIdentifier !== firstItem.identifier) {
      lines.push(
        `${indent(1)}${firstItem.identifier} | Blocked: ${blocked.join(", ")}`
      );
      lastIdentifier = firstItem.identifier;
    }

    lines.push(indent(2) + patternToPictograph(pattern));
    const everythingRollups = generateRollups(items.Everything);
    assertDefined(everythingRollups);
    printPatternSummary(
      lines,
      printCalculation(
        everythingRollups.minInSlot,
        everythingRollups.maxInSlot
      ),
      3
    );

    const contentGroups = new Map<string, ExtendedAutoSolveStrategyResult[]>();
    for (const item of items.Everything) {
      const steps: AutoSolveStep[] = [];
      for (const step of item.steps) {
        steps.push(step);
        const strategy = item.strategy as unknown as TileState[];
        if (
          (!strategy.includes(TileState.Sword) || step.solvedSword) &&
          (!strategy.includes(TileState.Present) || step.solvedPresent) &&
          (!strategy.includes(TileState.Fox) ||
            isFoxCandidatesShownOrFoxFound(step))
        ) {
          break;
        }
      }

      const stepsStr = steps
        .map((step) => `${step.index}->${step.state[0]}`)
        .join(", ");
      const group = contentGroups.get(stepsStr) ?? [];
      group.push(item);
      contentGroups.set(stepsStr, group);
    }

    for (const foxIndex of [...pattern.ConfirmedFoxes, undefined]) {
      lines.push(`${indent(3)}Fox at ${foxIndex ?? "(No Fox)"}`);
      const everythingThisFox = items.Everything.filter(
        (item) => item.foxIndex === foxIndex
      );
      const everythingThisFoxRollups = generateRollups(everythingThisFox);
      assertDefined(everythingThisFoxRollups);
      printPatternSummary(
        lines,
        printCalculation(
          everythingThisFoxRollups.minInSlot,
          everythingThisFoxRollups.maxInSlot
        ),
        4
      );
      lines.push("");

      for (const [stepStr, group] of contentGroups) {
        const groupsForFoxIndex = group.filter(
          (item) => item.foxIndex === foxIndex
        );

        if (groupsForFoxIndex.length < 1) {
          continue;
        }

        lines.push(indent(4) + stepStr);

        const all = generateRollups(
          groupsForFoxIndex.filter((item) => item.strategy === STRATEGY_All)
        );
        const fox = generateRollups(
          groupsForFoxIndex.filter((item) => item.strategy === STRATEGY_Fox)
        );
        const swordPresent = generateRollups(
          groupsForFoxIndex.filter(
            (item) => item.strategy === STRATEGY_SwordPresent
          )
        );
        const swordFox = generateRollups(
          groupsForFoxIndex.filter(
            (item) => item.strategy === STRATEGY_SwordFox
          )
        );
        const presentFox = generateRollups(
          groupsForFoxIndex.filter(
            (item) => item.strategy === STRATEGY_PresentFox
          )
        );

        const groupLines: string[] = [];

        if (all !== undefined) {
          groupLines.push(
            [
              stringifyMinMax("T", {
                min: all.minInSlot.UncoverAll,
                max: all.maxInSlot.UncoverAll,
              }),
              stringifyMinMax("t", {
                min: all.minInSlot.FoundAll,
                max: all.maxInSlot.FoundAll,
              }),
              `s${all.minInSlot.FoundSword}+${all.minInSlot.swordFullSteps}`,
              `p${all.minInSlot.FoundPresent}+${all.minInSlot.presentFullSteps}`,
            ].join(" ")
          );
        }
        if (swordPresent !== undefined) {
          assertEqual(
            swordPresent.minInSlot.FoundSwordPresent,
            swordPresent.maxInSlot.FoundSwordPresent
          );
          assertEqual(
            swordPresent.minInSlot.UncoverSwordPresent,
            swordPresent.maxInSlot.UncoverSwordPresent
          );
          groupLines.push(
            [
              `SP${swordPresent.minInSlot.UncoverSwordPresent}`,
              `sp${swordPresent.minInSlot.FoundSwordPresent}`,
            ].join(" ")
          );
        }
        if (swordFox !== undefined) {
          groupLines.push(
            [
              stringifyMinMax("SF", {
                min: swordFox.minInSlot.UncoverSwordFox,
                max: swordFox.maxInSlot.UncoverSwordFox,
              }),
            ].join(" ")
          );
        }
        if (presentFox !== undefined) {
          groupLines.push(
            [
              stringifyMinMax("PF", {
                min: presentFox.minInSlot.UncoverPresentFox,
                max: presentFox.maxInSlot.UncoverPresentFox,
              }),
            ].join(" ")
          );
        }
        if (fox !== undefined) {
          groupLines.push(
            [
              stringifyMinMax("F", {
                min: fox.minInSlot.UncoverFox,
                max: fox.maxInSlot.UncoverFox,
              }),
            ].join(" ")
          );
        }

        lines.push(
          ...groupLines.map(
            (line, index) =>
              indent(4) + (index + 1 === groupLines.length ? "╰ " : "├ ") + line
          )
        );
        lines.push("");
      }
    }
  }
}
