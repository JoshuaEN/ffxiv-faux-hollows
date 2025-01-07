import {
  assertDefined,
  assertEqual,
  assertUnreachable,
} from "~/src/helpers.js";
import { ExtendedAutoSolveStrategyResult } from "../types/solve-result.js";

export function crossCheckRotations(
  identifierGroups: Map<string, ExtendedAutoSolveStrategyResult[]>
) {
  for (const [patternKey1, patternKey2, patternKey3, patternKey4] of [
    ["A←", "A↑", "A→", "A↓"],
    ["B←", "B↑", "B→", "B↓"],
    ["C←", "C↑", "C→", "C↓"],
    ["D←", "D↑", "D→", "D↓"],
  ] as const) {
    const [items1, items2, items3, items4] = [
      identifierGroups.get(patternKey1)?.sort(stableSortForResults),
      identifierGroups.get(patternKey2)?.sort(stableSortForResults),
      identifierGroups.get(patternKey3)?.sort(stableSortForResults),
      identifierGroups.get(patternKey4)?.sort(stableSortForResults),
    ];
    assertDefined(items1);
    assertDefined(items2);
    assertDefined(items3);
    assertDefined(items4);

    assertEqual(items1.length, items2.length);
    assertEqual(items1.length, items3.length);
    assertEqual(items1.length, items4.length);

    for (let i = 0; i < items1.length; i++) {
      const row1: ExtendedAutoSolveStrategyResult | undefined = items1[i];
      const row2: ExtendedAutoSolveStrategyResult | undefined = items2[i];
      const row3: ExtendedAutoSolveStrategyResult | undefined = items3[i];
      const row4: ExtendedAutoSolveStrategyResult | undefined = items4[i];
      assertDefined(row1);
      assertDefined(row2);
      assertDefined(row3);
      assertDefined(row4);
      assertEqual(compareResultSteps(row1, row2), 0, () =>
        JSON.stringify([row1, row2], null, 2)
      );
      assertEqual(compareResultSteps(row1, row3), 0, () =>
        JSON.stringify([row1, row3], null, 2)
      );
      assertEqual(compareResultSteps(row1, row4), 0, () =>
        JSON.stringify([row1, row4], null, 2)
      );
    }
  }
}

function stableSortForResults(
  a: ExtendedAutoSolveStrategyResult,
  b: ExtendedAutoSolveStrategyResult
) {
  return compareResultSteps(a, b);
}

function compareResultSteps(
  a: ExtendedAutoSolveStrategyResult,
  b: ExtendedAutoSolveStrategyResult
) {
  if (a.strategy.join(",") !== b.strategy.join(",")) {
    return a.strategy.join(",").localeCompare(b.strategy.join(","));
  }
  if (a.FoundFoxCandidates !== b.FoundFoxCandidates) {
    return a.FoundFoxCandidates - b.FoundFoxCandidates;
  }
  if (a.FoundPresent !== b.FoundPresent) {
    return a.FoundPresent - b.FoundPresent;
  }
  if (a.FoundSword !== b.FoundSword) {
    return a.FoundSword - b.FoundSword;
  }
  if (a.UncoverFox !== b.UncoverFox) {
    return a.UncoverFox - b.UncoverFox;
  }
  if (a.UncoverPresent !== b.UncoverPresent) {
    return a.UncoverPresent - b.UncoverPresent;
  }
  if (a.UncoverSword !== b.UncoverSword) {
    return a.UncoverSword - b.UncoverSword;
  }
  if (a.steps.length !== b.steps.length) {
    return a.steps.length - b.steps.length;
  }
  for (let i = 0; i < a.steps.length; i++) {
    const aStep = a.steps[i];
    const bStep = b.steps[i];
    assertDefined(aStep);
    assertDefined(bStep);

    if (aStep.state !== bStep.state) {
      return aStep.state.localeCompare(bStep.state);
    }
    if (aStep.solvedSword !== bStep.solvedSword) {
      return aStep.solvedSword ? 1 : -1;
    }
    if (aStep.solvedPresent !== bStep.solvedPresent) {
      return aStep.solvedPresent ? 1 : -1;
    }
    if (aStep.solvedFox !== bStep.solvedFox) {
      return aStep.solvedFox ? 1 : -1;
    }
    if (aStep.foxCandidates !== bStep.foxCandidates) {
      return aStep.foxCandidates - bStep.foxCandidates;
    }
    if (aStep.patternsRemaining !== bStep.patternsRemaining) {
      if (aStep.patternsRemaining === null) {
        return -1;
      }
      if (bStep.patternsRemaining === null) {
        return 1;
      }
      if (aStep.patternsRemaining.length !== bStep.patternsRemaining.length) {
        return aStep.patternsRemaining.length - bStep.patternsRemaining.length;
      }
    }
    if (aStep.stepNumber !== bStep.stepNumber) {
      assertUnreachable();
    }
  }
  return 0;
}
