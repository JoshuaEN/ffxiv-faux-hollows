import { TileState } from "~/src/game/types/tile-states.js";
import { assert, assertDefined } from "~/src/helpers.js";
import { AutoSolveExpandedResultStepsTo } from "../types/expanded-result";
import { ExtendedAutoSolveStrategyResult } from "../types/solve-result.js";
import {
  STRATEGY_All,
  STRATEGY_Fox,
  STRATEGY_PresentFox,
  STRATEGY_SwordFox,
  STRATEGY_SwordPresent,
} from "../types/strategies.js";
import {
  isFoxCandidatesShown,
  isFoxCandidatesShownOrFoxFound,
} from "./fox-status.js";
import { NO_FOX_MULTIPLIER } from "../const.js";

export type ExtendedAutoSolveRollups = NonNullable<
  ReturnType<typeof generateRollups>
>;
export function generateRollups(
  patternGroup: ExtendedAutoSolveStrategyResult[]
) {
  if (patternGroup.length === 0) {
    return;
  }
  const totalsInSlot = fillEmptyStepsTo(() => 0);
  const itemsInSlot = fillEmptyStepsTo((): number[] => []);
  const countPerStepsInSlot = fillEmptyStepsTo(() => new Map<number, number>());
  const minInSlot = fillEmptyStepsTo(() => Number.MAX_SAFE_INTEGER);
  const maxInSlot = fillEmptyStepsTo(() => Number.MIN_SAFE_INTEGER);

  for (const pattern of patternGroup) {
    function update(value: number, key: keyof AutoSolveExpandedResultStepsTo) {
      if (value < minInSlot[key]) {
        minInSlot[key] = value;
      }
      if (value > maxInSlot[key]) {
        maxInSlot[key] = value;
      }
      let times = pattern.foxIndex === undefined ? NO_FOX_MULTIPLIER : 1;
      while (times > 0) {
        totalsInSlot[key] += value;
        itemsInSlot[key].push(value);
        countPerStepsInSlot[key].set(
          value,
          (countPerStepsInSlot[key].get(value) ?? 0) + 1
        );
        times--;
      }
    }

    const swordFullSteps =
      pattern.steps.find((step) => step.state === TileState.Sword) === undefined
        ? 6
        : 5;
    const presentFullSteps =
      pattern.steps.find((step) => step.state === TileState.Present) ===
      undefined
        ? 4
        : 3;

    if (pattern.strategy === STRATEGY_Fox) {
      update(pattern.UncoverFox, "UncoverFox");
      update(
        pattern.steps.findIndex(
          (step) =>
            step.solvedFox === true || isFoxCandidatesShownOrFoxFound(step)
        ) + 1,
        "FoundFoxCandidates"
      );
    }

    if (pattern.strategy === STRATEGY_SwordPresent) {
      const foundSwordPresent = Math.max(
        pattern.FoundSword,
        pattern.FoundPresent
      );
      update(foundSwordPresent, "FoundSwordPresent");
      const fullSwordPresent = Math.max(
        pattern.UncoverSword,
        pattern.UncoverPresent
      );
      update(fullSwordPresent, "UncoverSwordPresent");
    }

    if (pattern.strategy === STRATEGY_All) {
      update(pattern.FoundSword, "FoundSword");
      update(pattern.FoundPresent, "FoundPresent");
      // Technically we could generate these "correctly" (as in "UncoverSword/UncoverPresent")
      // if we had STRATEGY_SWORD and STRATEGY_PRESENT in addition to the other strategies,
      // but it already takes the Playwright mode over 12 hours for one rotation of some patterns with the existing set of
      // strategies, and these stats aren't important in comparison to the results for the actual strategies people might use
      // (SwordPresent, SwordFox, PresentFox)
      // I'm only keeping them because it's interesting.
      update(pattern.FoundSword + swordFullSteps, "UncoverSword");
      update(pattern.FoundPresent + presentFullSteps, "UncoverPresent");
      const uncoverAll = Math.max(
        pattern.UncoverSword,
        pattern.UncoverPresent,
        pattern.UncoverFox
      );
      update(uncoverAll, "UncoverAll");

      // The other solver only has steps up to the point everything is found (for fox, found just means "shows possible locations")
      const stepWhereAllSolved = pattern.steps.find(
        (step) =>
          step.solvedSword &&
          step.solvedPresent &&
          isFoxCandidatesShownOrFoxFound(step)
      );
      assertDefined(stepWhereAllSolved);
      const foxCandidatesShown = isFoxCandidatesShown(stepWhereAllSolved);
      const foundAllMax = foxCandidatesShown
        ? stepWhereAllSolved.stepNumber + stepWhereAllSolved.foxCandidates
        : stepWhereAllSolved.stepNumber;
      const foundAllMin = foxCandidatesShown
        ? stepWhereAllSolved.stepNumber + 1
        : stepWhereAllSolved.stepNumber;
      if (foxCandidatesShown) {
        // Represent the range
        update(foundAllMax, "FoundAll");
        update(foundAllMin, "FoundAll");
      } else {
        assert(foundAllMax === foundAllMin);
        update(foundAllMax, "FoundAll");
      }
    }

    if (pattern.strategy === STRATEGY_SwordFox) {
      const bestSwordFox = Math.max(pattern.UncoverSword, pattern.UncoverFox);
      update(bestSwordFox, "UncoverSwordFox");
    }
    if (pattern.strategy === STRATEGY_PresentFox) {
      const bestPresentFox = Math.max(
        pattern.UncoverPresent,
        pattern.UncoverFox
      );
      update(bestPresentFox, "UncoverPresentFox");
    }

    update(swordFullSteps, "swordFullSteps");
    update(presentFullSteps, "presentFullSteps");
  }

  return {
    minInSlot,
    maxInSlot,
    countPerStepsInSlot,
    totalsInSlot,
    itemsInSlot,
  };
}

function fillEmptyStepsTo<T>(
  value: () => T
): Record<keyof AutoSolveExpandedResultStepsTo, T> {
  return {
    FoundSwordPresent: value(),
    FoundFoxCandidates: value(),
    FoundAll: value(),
    UncoverSword: value(),
    UncoverPresent: value(),
    UncoverSwordPresent: value(),
    UncoverAll: value(),
    UncoverFox: value(),
    UncoverSwordFox: value(),
    UncoverPresentFox: value(),
    swordFullSteps: value(),
    presentFullSteps: value(),
    FoundSword: value(),
    FoundPresent: value(),
  };
}

export function rollupFoxNoFox(
  patternGroup: ExtendedAutoSolveStrategyResult[]
) {
  const all = generateRollups(patternGroup);
  assertDefined(all);
  const noFox = generateRollups(
    patternGroup.filter((p) => p.foxIndex === undefined)
  );
  assertDefined(noFox);
  return { all, noFox };
}
