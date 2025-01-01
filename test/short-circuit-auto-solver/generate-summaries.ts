import { TileState } from "~/src/game/types/tile-states.js";
import { assert } from "~/src/helpers.js";
import {
  ShortCircuitAutoSolveIdentifierSet,
  ShortCircuitAutoSolveResultStepTaken,
} from "./auto-solver.js";
import { CommunityDataPattern } from "~/src/game/types/community-data.js";
import { expandedStepsTo } from "./expanded-steps-to.js";

export interface ShortCircuitAutoSolveExpandedResultStepTaken
  extends ShortCircuitAutoSolveResultStepTaken {
  worstFox?: boolean;
}

export interface ShortCircuitAutoSolveExpandedResultStepsTo {
  // Un-prefixed means the exact location of the shape has been found.
  // Note: The shape may not have any tiles revealed, if the shape can be found by process of elimination.
  FoundSword: number;
  FoundPresent: number;
  FoundSwordPresent: number;
  FoundFox: number;

  FoundAll: number;

  UncoverSword: number;
  UncoverPresent: number;
  UncoverSwordPresent: number;
  UncoverAll: number;
  // "best" means fully revealing the shape, skipping steps which are not important.
  // For Sword/Present there's no difference because we're already trying to find these two shapes as a priority.
  // For Fox though, we sometimes narrow down the possible foxes to a single set of four before we locate all of the shapes.
  //
  // For example, pattern set A has a _lot_ of patterns where finding the Sword leads to a 50/50 on the Present,
  // but regardless of where the Present is, the foxes are in the same location (a single set of foxes).
  //
  // Accounting for this gives a more accurate representation of the odds for users who are looking to
  // specifically target foxes.
  UncoverFox: number;
  UncoverSwordFox: number;
  UncoverPresentFox: number;
  UncoverBestAll: number;

  // Number of additional steps to fully uncover the target after finding the tile
  swordFullSteps: number;
  presentFullSteps: number;

  possibleFoxIndexes4: number;
  possibleFoxIndexes3: number;
  possibleFoxIndexes2: number;
  possibleFoxIndexes1: number;
  possibleFoxIndexes0: number;
}

export interface ShortCircuitAutoSolveExpandedResult {
  identifier: string;
  blocked: readonly number[];
  pattern: CommunityDataPattern;
  foxIndex: number | undefined;
  id: number;
  steps: ShortCircuitAutoSolveExpandedResultStepTaken[];
  stepsTo: ShortCircuitAutoSolveExpandedResultStepsTo;
}

const foxDiffLookupTable: Record<number, (TileState.Fox | number)[][]> =
  (() => {
    const A = 0;
    const B = 1;
    const Correct = TileState.Fox;
    const D = 2;
    return {
      // There is only one fox tile available (or the fox was already found)
      0: [[Correct]],
      // There is two fox tiles available, leaving us two options: We pick the correct 1, or we pick the wrong one and then the correct one.
      1: [[Correct], [A, Correct]],
      // There is three fox tiles available (A, B, Correct):
      2: [
        // 1. We pick the correct tile first (Correct)
        [Correct],
        // 2. We pick the wrong tile first followed by the correct one (A -> Correct)
        [A, Correct],
        // 3. We pick the wrong tile first followed by the correct one (B -> Correct)
        [B, Correct],
        // 4. We pick the wrong tile first and second followed by finally the correct one (A -> B -> Correct)
        [A, B, Correct],
        // 5. We pick the wrong tile first and second followed by finally the correct one (B -> A -> Correct)
        [B, A, Correct],
      ],
      // There is four fox tiles available (A, B, D, Correct):
      3: [
        // 1. We pick the correct tile first (Correct)
        [Correct],
        // 2. We pick the wrong tile first followed by the correct one (A -> Correct)
        [A, Correct],
        // 3. We pick the wrong tile first followed by the correct one (B -> Correct)
        [B, Correct],
        // 4. We pick the wrong tile first followed by the correct one (D -> Correct)
        [D, Correct],
        // 5. We pick the wrong tile first and second followed by finally the correct one (A -> B -> Correct)
        [A, B, Correct],
        // 6. We pick the wrong tile first and second followed by finally the correct one (A -> D -> Correct)
        [A, D, Correct],
        // 7. We pick the wrong tile first and second followed by finally the correct one (B -> A -> Correct)
        [B, A, Correct],
        // 8. We pick the wrong tile first and second followed by finally the correct one (B -> D -> Correct)
        [B, D, Correct],
        // 9. We pick the wrong tile first and second followed by finally the correct one (D -> A -> Correct)
        [D, A, Correct],
        //10. We pick the wrong tile first and second followed by finally the correct one (D -> B -> Correct)
        [D, B, Correct],
        //11. We pick the wrong tile first and second followed by finally the correct one (A -> B -> D -> Correct)
        [A, B, D, Correct],
        //12. We pick the wrong tile first and second followed by finally the correct one (A -> D -> B -> Correct)
        [A, D, B, Correct],
        //13. We pick the wrong tile first and second followed by finally the correct one (B -> A -> D -> Correct)
        [B, A, D, Correct],
        //14. We pick the wrong tile first and second followed by finally the correct one (B -> D -> A -> Correct)
        [B, D, A, Correct],
        //15. We pick the wrong tile first and second followed by finally the correct one (D -> A -> B -> Correct)
        [D, A, B, Correct],
        //16. We pick the wrong tile first and second followed by finally the correct one (D -> B -> A -> Correct)
        [D, B, A, Correct],
      ],
    };
  })();

export function generateSummaries(
  results: Record<string, ShortCircuitAutoSolveIdentifierSet>
) {
  let shortCircuitTotal = 0;
  const summaries: ShortCircuitAutoSolveExpandedResult[] = [];
  let id = 0;
  for (const [identifier, set] of Object.entries(results).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    for (const item of set.patternResults) {
      for (const result of item.solveResults.sort(
        (a, b) => a.foxIndex - b.foxIndex
      )) {
        shortCircuitTotal += 1;

        const foxVariants =
          foxDiffLookupTable[
            result.stepsTo[TileState.Fox].max -
              result.stepsTo[TileState.Fox].min
          ];
        assert(foxVariants !== undefined);
        for (const stepsToAdd of foxVariants) {
          id++;

          const updatedSteps: ShortCircuitAutoSolveExpandedResultStepTaken[] = [
            ...result.steps,
          ];
          if (result.foxCandidates.length > 0) {
            assert(
              updatedSteps.find((step) => step.state === TileState.Fox) ===
                undefined
            );
            assert(
              updatedSteps[updatedSteps.length - 1]?.stepNumber ===
                result.stepsTo.totalSteps.min - 1
            );
            const filteredFoxCandidates = result.foxCandidates.filter(
              (index) => index !== result.foxIndex
            );
            assert(
              filteredFoxCandidates.length === result.foxCandidates.length - 1
            );
            const startingLastStep = updatedSteps[updatedSteps.length - 1];
            assert(startingLastStep?.patternsRemaining.length === 1);
            assert(startingLastStep.solvedPresent === true);
            assert(startingLastStep.solvedSword === true);
            let lastStep = startingLastStep;
            updatedSteps.push(
              ...stepsToAdd.map((step, addedStepIndex) => {
                const isEmpty = typeof step === "number";
                const stepIndex = isEmpty
                  ? filteredFoxCandidates[step]
                  : result.foxIndex;
                assert(stepIndex !== undefined);
                lastStep = {
                  state: isEmpty ? TileState.Empty : step,
                  index: stepIndex,
                  stepNumber: result.stepsTo.totalSteps.min + addedStepIndex,
                  patternsRemaining: lastStep.patternsRemaining,
                  solvedPresent: true,
                  solvedSword: true,
                  foxCandidatesRemaining: isEmpty
                    ? lastStep.foxCandidatesRemaining.filter(
                        (c) => c.index !== stepIndex
                      )
                    : [],
                  worstFox:
                    isEmpty === false &&
                    stepsToAdd.length ===
                      foxVariants[foxVariants.length - 1]?.length,
                };
                return lastStep;
              })
            );
          }
          assert(
            updatedSteps.filter((s) => s.state === TileState.Fox).length === 1
          );
          const uniqueUpdatedSteps = new Set(
            updatedSteps.map((step) => step.index)
          );
          assert(uniqueUpdatedSteps.size === updatedSteps.length);
          const uniqueStepNumber = new Set(
            updatedSteps.map((step) => step.index)
          );
          assert(uniqueStepNumber.size === updatedSteps.length);

          const foxStep = updatedSteps.find(
            (s) => s.state === TileState.Fox
          )?.stepNumber;
          assert(foxStep !== undefined);
          const maxStep = updatedSteps.reduce(
            (p, s) => Math.max(p, s.stepNumber),
            0
          );
          assert(
            maxStep ===
              Math.max(
                result.stepsTo[TileState.Sword],
                result.stepsTo[TileState.Present],
                foxStep
              )
          );
          assert(maxStep >= result.stepsTo.totalSteps.min);
          const {
            bestFoxSteps,
            bestPresentFoxSteps,
            bestSwordFoxSteps,
            bestTotalSteps,
            swordFullSteps,
            presentFullSteps,
          } = expandedStepsTo(
            {
              [TileState.Sword]: result.stepsTo[TileState.Sword],
              [TileState.Present]: result.stepsTo[TileState.Present],
              Fox: { min: foxStep, max: foxStep },
              totalSteps: { min: maxStep, max: maxStep },
            },
            updatedSteps
          );
          const stepsToRemainingFoxes: Record<
            0 | 1 | 2 | 3 | 4,
            number | null
          > = {
            [4]: null,
            [3]: null,
            [2]: null,
            [1]: null,
            [0]: null,
          };
          for (let i = 0; i < updatedSteps.length; i++) {
            const step = updatedSteps[i];
            assert(step !== undefined);
            assert(i + 1 === step.stepNumber);
            const remainingFoxIndexes = step.foxCandidatesRemaining.length;
            if (remainingFoxIndexes <= 4) {
              stepsToRemainingFoxes[4] ??= step.stepNumber;
            }
            if (remainingFoxIndexes <= 3) {
              stepsToRemainingFoxes[3] ??= step.stepNumber;
            }
            if (remainingFoxIndexes <= 2) {
              stepsToRemainingFoxes[2] ??= step.stepNumber;
            }
            if (remainingFoxIndexes <= 1) {
              stepsToRemainingFoxes[1] ??= step.stepNumber;
            }
            if (remainingFoxIndexes <= 0) {
              stepsToRemainingFoxes[0] ??= step.stepNumber;
            }
          }
          assert(stepsToRemainingFoxes[4] !== null);
          assert(stepsToRemainingFoxes[3] !== null);
          assert(stepsToRemainingFoxes[2] !== null);
          assert(stepsToRemainingFoxes[1] !== null);
          assert(stepsToRemainingFoxes[0] !== null);

          assert(stepsToRemainingFoxes[0] >= stepsToRemainingFoxes[1]);
          assert(stepsToRemainingFoxes[1] >= stepsToRemainingFoxes[2]);
          assert(stepsToRemainingFoxes[2] >= stepsToRemainingFoxes[3]);
          assert(
            stepsToRemainingFoxes[4] ===
              result.steps.find((s) => s.foxCandidatesRemaining.length <= 4)
                ?.stepNumber
          );

          assert(bestFoxSteps.min === bestFoxSteps.max);
          assert(bestPresentFoxSteps.min === bestPresentFoxSteps.max);
          assert(bestSwordFoxSteps.min === bestSwordFoxSteps.max);
          assert(bestTotalSteps.min === bestTotalSteps.max);
          const summary: ShortCircuitAutoSolveExpandedResult = {
            identifier,
            blocked: set.blocked,
            pattern: item.pattern,
            foxIndex: result.foxIndex,
            steps: updatedSteps,
            stepsTo: {
              FoundSword: result.stepsTo[TileState.Sword],
              FoundPresent: result.stepsTo[TileState.Present],
              FoundSwordPresent: Math.max(
                result.stepsTo[TileState.Sword],
                result.stepsTo[TileState.Present]
              ),
              FoundFox: foxStep,
              FoundAll: maxStep,

              UncoverSword: result.stepsTo[TileState.Sword] + swordFullSteps,
              UncoverPresent:
                result.stepsTo[TileState.Present] + presentFullSteps,
              UncoverSwordPresent:
                Math.max(
                  result.stepsTo[TileState.Sword],
                  result.stepsTo[TileState.Present]
                ) +
                swordFullSteps +
                presentFullSteps,
              UncoverAll:
                Math.max(
                  result.stepsTo[TileState.Sword],
                  result.stepsTo[TileState.Present],
                  foxStep
                ) +
                swordFullSteps +
                presentFullSteps,

              UncoverFox: bestFoxSteps.min,
              UncoverSwordFox: bestSwordFoxSteps.min,
              UncoverPresentFox: bestPresentFoxSteps.min,
              UncoverBestAll: bestTotalSteps.min,

              swordFullSteps,
              presentFullSteps,

              possibleFoxIndexes4: stepsToRemainingFoxes[4],
              possibleFoxIndexes3: stepsToRemainingFoxes[3],
              possibleFoxIndexes2: stepsToRemainingFoxes[2],
              possibleFoxIndexes1: stepsToRemainingFoxes[1],
              possibleFoxIndexes0: stepsToRemainingFoxes[0],
            },
            id,
          };
          assert(summary.stepsTo.UncoverBestAll === summary.stepsTo.UncoverAll);
          summaries.push(summary);
        }
      }
    }
  }

  return { summaries, shortCircuitTotal };
}
