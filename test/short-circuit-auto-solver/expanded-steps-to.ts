import { TileState } from "~/src/game/types/tile-states.js";
import { assert } from "~/src/helpers.js";
import {
  ShortCircuitAutoSolveResultStepTaken,
  ShortCircuitAutoSolveResultStepsTo,
} from "./auto-solver.js";

/**
 * This calculates the steps needed to fully uncover the Sword, Present, Fox, and all combinations there in.
 *
 * For Sword and Present, we find where the Sword/Present was first located (via provided stepsTo),
 * determine if a Sword/Present tile was uncovered (to determine the number of remaining tiles to uncover),
 * and then add the stepsTo with the remaining tiles to uncover.
 *
 * For Fox, there are several variations.
 * In general, we find the point where solving for the Fox via brute force will take the least number of steps (because sometimes we know this before we find both the Present/Sword).
 *
 *
 * A) Fox not present:
 *    Sword -> 8 fox candidates
 *    Present -> 4 fox candidates [*]
 *
 *    Sword: 1+5
 *    Present: 2+3
 *    Fox: 2+[1,4]
 *    Sword+Fox: 2+[5+1,5+4]
 *    Present+Fox: 2+[3+1,3+4]
 *    Total: 2+[5+3+1, 5+3+4]
 *
 * B) Fox not present, best not last:
 *    Sword -> 4 fox candidates [*]
 *    Present -> 4 fox candidates
 *
 *    Sword: 1+5
 *    Present: 2+3
 *    Fox: 1+[1,4]
 *    Sword+Fox: 1+[5+1,5+4]
 *    Present+Fox: 2+[3+1,3+4]
 *    Total: 2+[5+3+1,5+3+4]
 *
 * C) Fox present
 *    Sword -> 8 fox candidates
 *    Present -> 4 fox candidates
 *    Empty -> 3 fox candidates [*]
 *    Fox -> 0 fox candidates
 *
 *    Sword: 1+5
 *    Present: 2+3
 *    Fox: 3+1
 *    Sword+Fox: 3+5+1
 *    Present+Fox: 3+3+1
 *    Total: 3+5+3+1
 *
 * D) Fox present before Sword and/or Present, finds Sword/Present
 *    Sword -> 8 fox candidates
 *    Fox -> 0 fox candidates [*] [found present]
 *
 *    Sword: 1+5
 *    Present: 2+4
 *    Fox: 2+0
 *    Sword+Fox: 2+5+0
 *    Present+Fox: 2+4+0
 *    Total: 2+5+4+0
 *
 * E) Fox present before Sword and/or Present, doesn't find Present
 *    Sword -> 8 fox candidates
 *    Fox -> 0 fox candidates [*]
 *    Present -> 0 fox candidates
 *
 *    Sword: 1+5
 *    Present: 3+3
 *    Fox: 2+0
 *    Sword+Fox: 2+5+0
 *    Present+Fox: 3+3+0
 *    Total: 3+5+3+0
 * F) Gaps
 *    Empty -> 12 fox candidates
 *    Sword -> 8 fox candidates
 *    Empty -> 3 fox candidates [*]
 *    Fox -> 0 fox candidates [found present]
 *
 *    Sword: 2+5
 *    Present: 3+3
 *    Fox: 3+1
 *    Sword+Fox: 3+5+1
 *    Present+Fox: 3+4+1
 *    Total: 3+5+4+1
 * G) ???
 *    Empty -> 12 fox candidates
 *    Sword -> 8 fox candidates
 *    Empty -> 3 fox candidates [*]
 *    Empty -> 2 fox candidates [found present]
 *
 *    Sword: 2+5
 *    Present: 4+4
 *    Fox: 4+[1,2]
 *    Sword+Fox: 3+[2,3]
 *    Present+Fox: 4+4+[1,2]
 *    Total: 4+5+4+[1,2]
 *
 * H) ???
 *    Sword -> 4 fox candidates [*]
 *    Empty -> 4 fox candidates
 *    Empty -> 3 fox candidates
 *    Empty -> 2 fox candidates [found present]
 *
 *    Sword: 1+5
 *    Present: 4+4
 *    Fox: 1+[1,4]
 *    Sword+Fox: 1+5+[1,4]
 *    Present+Fox: 4+4+[1,2] [!] Here we need to account for the fact finding the Present also eliminated some fox candidates.
 *    Total: 4+5+4+[1,2]     [!] Here too.
 *    [Note] Here the auto-solver would say the stepsTo Fox are [5,6] because it is only considering the steps needed to finish from the actual path it took.
 * I) ???
 *    Sword -> 8 fox candidates
 *
 */
export function expandedStepsTo(
  stepsTo: ShortCircuitAutoSolveResultStepsTo,
  steps: ShortCircuitAutoSolveResultStepTaken[]
) {
  const swordFullSteps = steps.some((step) => step.state === TileState.Sword)
    ? 5
    : 6;
  const presentFullSteps = steps.some(
    (step) => step.state === TileState.Present
  )
    ? 3
    : 4;

  let stepToStartFoxSolve = steps[0];
  let stepToStartPresentSolve = steps[0];
  let stepToStartSwordSolve = steps[0];
  let foxStep: ShortCircuitAutoSolveResultStepTaken | undefined;
  assert(stepToStartFoxSolve !== undefined);
  assert(stepToStartPresentSolve !== undefined);
  assert(stepToStartSwordSolve !== undefined);

  {
    let solvedSwordPresent = false;
    for (const step of steps) {
      if (step.state === TileState.Fox) {
        assert(foxStep === undefined);
        foxStep = step;
      }
      if (step === stepToStartFoxSolve || solvedSwordPresent) {
        continue;
      }

      if (
        step.state !== TileState.Fox &&
        foxStep === undefined &&
        (step.stepNumber + step.foxCandidatesRemaining.length <
          stepToStartFoxSolve.stepNumber +
            stepToStartFoxSolve.foxCandidatesRemaining.length ||
          (step.stepNumber + step.foxCandidatesRemaining.length ===
            stepToStartFoxSolve.stepNumber +
              stepToStartFoxSolve.foxCandidatesRemaining.length &&
            step.foxCandidatesRemaining.length <
              stepToStartFoxSolve.foxCandidatesRemaining.length) ||
          step.foxCandidatesRemaining.length > 4)
      ) {
        stepToStartFoxSolve = step;
      }

      if (
        stepToStartPresentSolve.solvedPresent !== true &&
        step.solvedPresent
      ) {
        stepToStartPresentSolve = step;
      }
      if (stepToStartSwordSolve.solvedSword !== true && step.solvedSword) {
        stepToStartSwordSolve = step;
      }

      // It's not possible to further narrow down the Fox results
      // (beyond guessing on Fox tiles)
      if (step.solvedSword && step.solvedPresent) {
        solvedSwordPresent = true;
      }
    }
  }

  assert(stepToStartPresentSolve.solvedPresent);
  assert(stepToStartSwordSolve.solvedSword);
  assert(stepToStartPresentSolve.stepNumber === stepsTo[TileState.Present]);
  assert(stepToStartSwordSolve.stepNumber === stepsTo[TileState.Sword]);

  const foxStepMinMaxFromStart = (
    stepToStart: ShortCircuitAutoSolveResultStepTaken,
    fixedStepCount = 0
  ) => {
    const minIfFoxNotFound =
      stepToStart.state === TileState.Fox ||
      stepToStart.foxCandidatesRemaining.length === 0
        ? 0
        : 1;
    const maxIfFoxNotFound = stepToStart.foxCandidatesRemaining.length;
    if (foxStep === undefined) {
      return {
        min: minIfFoxNotFound + fixedStepCount,
        max: maxIfFoxNotFound + fixedStepCount,
      };
    }

    if (stepToStart.state === TileState.Fox) {
      return { min: 0 + fixedStepCount, max: 0 + fixedStepCount };
    }

    let usefulStepsFromStart = 0;
    let priorStepFoxCandidates = stepToStart.foxCandidatesRemaining.length;
    for (const step of steps) {
      if (step.stepNumber <= stepToStart.stepNumber) {
        continue;
      }

      if (priorStepFoxCandidates === step.foxCandidatesRemaining.length) {
        continue;
      }
      usefulStepsFromStart += 1;
      priorStepFoxCandidates = step.foxCandidatesRemaining.length;
    }
    assert(usefulStepsFromStart >= minIfFoxNotFound);
    assert(usefulStepsFromStart <= maxIfFoxNotFound);
    return {
      min: usefulStepsFromStart + fixedStepCount,
      max: usefulStepsFromStart + fixedStepCount,
    };
  };

  const foxStepsFromStart = foxStepMinMaxFromStart(stepToStartFoxSolve);

  const swordFoxStart =
    steps[
      Math.max(stepsTo[TileState.Sword], stepToStartFoxSolve.stepNumber) - 1
    ];
  assert(swordFoxStart !== undefined);
  const swordFoxStepsFromStart = foxStepMinMaxFromStart(
    swordFoxStart,
    swordFullSteps
  );

  const presentFoxStart =
    steps[
      Math.max(stepsTo[TileState.Present], stepToStartFoxSolve.stepNumber) - 1
    ];
  assert(presentFoxStart !== undefined);
  const presentFoxStepsFromStart = foxStepMinMaxFromStart(
    presentFoxStart,
    presentFullSteps
  );

  const totalStart =
    steps[
      Math.max(
        stepsTo[TileState.Sword],
        stepsTo[TileState.Present],
        stepToStartFoxSolve.stepNumber
      ) - 1
    ];
  assert(totalStart !== undefined);
  const totalStepsFromStart = foxStepMinMaxFromStart(
    totalStart,
    swordFullSteps + presentFullSteps
  );

  const result = {
    swordFullSteps,
    presentFullSteps,

    fullSwordSteps: stepsTo[TileState.Sword] + swordFullSteps,
    fullPresentSteps: stepsTo[TileState.Present] + presentFullSteps,

    bestFoxSteps: {
      min: stepToStartFoxSolve.stepNumber + foxStepsFromStart.min,
      max: stepToStartFoxSolve.stepNumber + foxStepsFromStart.max,
    },
    bestSwordFoxSteps: {
      min: swordFoxStart.stepNumber + swordFoxStepsFromStart.min,
      max: swordFoxStart.stepNumber + swordFoxStepsFromStart.max,
    },
    bestPresentFoxSteps: {
      min: presentFoxStart.stepNumber + presentFoxStepsFromStart.min,
      max: presentFoxStart.stepNumber + presentFoxStepsFromStart.max,
    },
    bestTotalSteps: {
      min: totalStart.stepNumber + totalStepsFromStart.min,
      max: totalStart.stepNumber + totalStepsFromStart.max,
    },
  } as const;

  if (stepsTo[TileState.Fox].min === stepsTo[TileState.Fox].max) {
    assert(result.bestFoxSteps.min === result.bestFoxSteps.max);
    assert(result.bestSwordFoxSteps.min === result.bestSwordFoxSteps.max);
    assert(result.bestPresentFoxSteps.min === result.bestPresentFoxSteps.max);
    assert(result.bestTotalSteps.min === result.bestTotalSteps.max);
  }

  assert(
    result.bestTotalSteps.min ===
      stepsTo.totalSteps.min + swordFullSteps + presentFullSteps
  );
  assert(
    result.bestTotalSteps.max ===
      stepsTo.totalSteps.max + swordFullSteps + presentFullSteps
  );

  if (foxStep !== undefined) {
    assert(result.bestFoxSteps.max <= foxStep.stepNumber);

    /**
     * Check all possible permutations
     */
    let foundExactMatchForFox = false;
    let foundExactMatchForSwordFox = false;
    let foundExactMatchForPresentFox = false;
    let foundExactMatchForTotal = false;
    for (const step of steps) {
      if (step === foxStep) {
        break;
      }
      let usefulStepsForSwordFox = step.stepNumber + swordFullSteps;
      let usefulStepsForPresentFox = step.stepNumber + presentFullSteps;
      let usefulStepsForTotal =
        step.stepNumber + swordFullSteps + presentFullSteps;
      let usefulStepsForFox = step.stepNumber;
      let lastStep = step;
      for (const nextStep of steps) {
        if (nextStep.stepNumber <= step.stepNumber) {
          continue;
        }
        if (
          nextStep.foxCandidatesRemaining < lastStep.foxCandidatesRemaining ||
          nextStep.foxCandidatesRemaining.length > 4
        ) {
          usefulStepsForFox += 1;
          usefulStepsForSwordFox += 1;
          usefulStepsForPresentFox += 1;
          usefulStepsForTotal += 1;
        } else {
          let upMax = false;
          if (!lastStep.solvedSword) {
            usefulStepsForSwordFox += 1;
            upMax = true;
          }
          if (!lastStep.solvedPresent) {
            usefulStepsForPresentFox += 1;
            upMax = true;
          }
          if (upMax) {
            usefulStepsForTotal += 1;
          }
        }
        lastStep = nextStep;
      }

      assert(usefulStepsForFox >= result.bestFoxSteps.max);
      assert(usefulStepsForSwordFox >= result.bestSwordFoxSteps.max);
      assert(usefulStepsForPresentFox >= result.bestPresentFoxSteps.max);
      assert(usefulStepsForTotal >= result.bestTotalSteps.max);

      if (usefulStepsForFox === result.bestFoxSteps.max) {
        foundExactMatchForFox = true;
      }
      if (usefulStepsForSwordFox === result.bestSwordFoxSteps.max) {
        foundExactMatchForSwordFox = true;
      }
      if (usefulStepsForPresentFox === result.bestPresentFoxSteps.max) {
        foundExactMatchForPresentFox = true;
      }
      if (usefulStepsForTotal === result.bestTotalSteps.max) {
        foundExactMatchForTotal = true;
      }
      assert(foundExactMatchForFox);
      assert(foundExactMatchForSwordFox);
      assert(foundExactMatchForPresentFox);
      assert(foundExactMatchForTotal);
    }
  }

  return result;
}
