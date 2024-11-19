import { CommunityDataPattern } from "~/src/game/types/community-data.js";
import { TileState } from "~/src/game/types/tile-states.js";
import {
  AutoSolveResultStepTaken,
  AutoSolveIdentifierSet,
  AutoSolveResult,
  AutoSolvePatternSet,
  AutoSolveResultStepsTo,
} from "./auto-solver.js";
import { assert, assertNever } from "~/src/helpers.js";

const formatter = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 3,
  minimumFractionDigits: 1,
});
const formatterPercent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});
const DELIMINATOR = ";";

interface AutoSolveResultSummary {
  identifier: string;
  blocked: readonly number[];
  pattern: CommunityDataPattern;
  foxIndex: number;
  id: number;
  steps: AutoSolveResultStepTaken[];
  stepsTo: {
    // Un-prefixed means the exact location of the shape has been found.
    // Note: The shape may not have any tiles revealed, if the shape can be found by process of elimination.
    [TileState.Sword]: number;
    [TileState.Present]: number;
    SwordPresent: number;
    Fox: number;
    totalSteps: number;
    // "full" means fully revealing the shape
    fullSword: number;
    fullPresent: number;
    fullSwordPresent: number;
    fullTotal: number;
    // "best" means fully revealing the shape, skipping steps which are not important.
    // For Sword/Present there's no difference because we're already trying to find these two shapes as a priority.
    // For Fox though, we sometimes narrow down the possible foxes to a single set of four before we locate all of the shapes.
    //
    // For example, pattern set A has a _lot_ of patterns where finding the Sword leads to a 50/50 on the Present,
    // but regardless of where the Present is, the foxes are in the same location (a single set of foxes).
    //
    // Accounting for this gives a more accurate representation of the odds for users who are looking to
    // specifically target foxes.
    bestFox: number;
    bestSwordFox: number;
    bestPresentFox: number;
    bestTotal: number;

    swordFullSteps: number;
    presentFullSteps: number;

    possibleFoxIndexes4: number;
    possibleFoxIndexes3: number;
    possibleFoxIndexes2: number;
    possibleFoxIndexes1: number;
    possibleFoxIndexes0: number;
  };
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

function patternToPictograph(pattern: CommunityDataPattern) {
  return `${pattern.Sword3x2 ? "▭" : "▯"}${pattern.Sword} ◻${pattern.Present}`;
}

export function stringifyAutoSolveResults(
  results: Record<string, AutoSolveIdentifierSet>,
  { enableText, enableCsv }: { enableText: boolean; enableCsv: boolean } = {
    enableText: true,
    enableCsv: false,
  }
): { text: string; csv: string } {
  let summaries: AutoSolveResultSummary[] = [];
  let shortCircuitTotal = 0;
  let id = 0;
  const lines: string[] = [];
  for (const [identifier, set] of Object.entries(results).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    lines.push(`${identifier} | Blocked: ${set.blocked.join(", ")}`);
    lines.push("");
    for (const item of set.patternResults) {
      lines.push(`${indent(1)}${patternToPictograph(item.pattern)}`);
      let foxIndex = -1;
      let initialSet: AutoSolveResult | null = null;
      for (const result of item.solveResults.sort(
        (a, b) => a.foxIndex - b.foxIndex
      )) {
        if (foxIndex !== result.foxIndex) {
          foxIndex = result.foxIndex;
          initialSet = result;
          lines.push(`${indent(2)} Fox at ${result.foxIndex}`);
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
            lines.push(`${indent(3)} <PATTERN BREAK>`);
            initialSet = result;
          }
        }

        {
          const {
            bestFoxSteps,
            bestPresentFoxSteps,
            bestSwordFoxSteps,
            swordFullSteps,
            presentFullSteps,
          } = expandedStepsTo(result.stepsTo, result.steps, item.pattern);

          lines.push(
            [
              `${indent(3)}`,
              stringifyMinMax("T", {
                min:
                  Math.max(
                    result.stepsTo.Sword,
                    result.stepsTo.Present,
                    result.stepsTo.Fox.min
                  ) +
                  swordFullSteps +
                  presentFullSteps,
                max:
                  Math.max(
                    result.stepsTo.Sword,
                    result.stepsTo.Present,
                    result.stepsTo.Fox.max
                  ) +
                  swordFullSteps +
                  presentFullSteps,
              }),
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
              result.steps
                .map((step) => `${step.index}->${step.state[0]}`)
                .join(", "),
            ].join(" ")
          );
        }
        shortCircuitTotal += 1;

        const foxVariants =
          foxDiffLookupTable[
            result.stepsTo[TileState.Fox].max -
              result.stepsTo[TileState.Fox].min
          ];
        assert(foxVariants !== undefined);
        for (const stepsToAdd of foxVariants) {
          id++;

          const updatedSteps = [...result.steps];
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
                  foxCandidatesRemaining: isEmpty
                    ? lastStep.foxCandidatesRemaining.filter(
                        (c) => c.index !== stepIndex
                      )
                    : [],
                };
                return lastStep;
              })
            );
          }
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
            updatedSteps,
            item.pattern
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

          if (result.stepsTo.Fox.min === result.stepsTo.Fox.max) {
            assert(stepsToRemainingFoxes[0] === stepsToRemainingFoxes[1]);
            assert(stepsToRemainingFoxes[0] === stepsToRemainingFoxes[2]);
            assert(stepsToRemainingFoxes[0] === stepsToRemainingFoxes[3]);
            assert(
              stepsToRemainingFoxes[4] ===
                result.steps.find((s) => s.foxCandidatesRemaining.length <= 4)
                  ?.stepNumber
            );
          } else {
            const remainingPossibleFoxesBeforeFinalSearch =
              item.pattern.ConfirmedFoxes.filter(
                (foxIndex) =>
                  result.steps.find((step) => step.index === foxIndex) ===
                  undefined
              ).length;

            function assertEqualUntil(equalBefore: number, equalAfter: number) {
              assert(equalBefore >= 0);
              assert(equalBefore <= 4);
              assert(equalAfter >= 0);
              assert(equalAfter <= 4);
              for (const key of [4, 3, 2, 1] as const) {
                const stepCountN = stepsToRemainingFoxes[key];
                const stepCountNm1 =
                  stepsToRemainingFoxes[
                    (key - 1) as keyof typeof stepsToRemainingFoxes
                  ];
                assert(stepCountN !== null);
                assert(stepCountNm1 !== null);

                if (key > equalBefore || key <= equalAfter) {
                  assert(stepCountNm1 === stepCountN);
                } else {
                  assert(stepCountNm1 > stepCountN);
                }
              }
            }

            assertEqualUntil(
              remainingPossibleFoxesBeforeFinalSearch,
              remainingPossibleFoxesBeforeFinalSearch - stepsToAdd.length
            );
          }

          assert(bestFoxSteps.min === bestFoxSteps.max);
          assert(bestPresentFoxSteps.min === bestPresentFoxSteps.max);
          assert(bestSwordFoxSteps.min === bestSwordFoxSteps.max);
          assert(bestTotalSteps.min === bestTotalSteps.max);
          const summary: AutoSolveResultSummary = {
            identifier,
            blocked: set.blocked,
            pattern: item.pattern,
            foxIndex: result.foxIndex,
            steps: updatedSteps,
            stepsTo: {
              [TileState.Sword]: result.stepsTo[TileState.Sword],
              [TileState.Present]: result.stepsTo[TileState.Present],
              SwordPresent: Math.max(
                result.stepsTo[TileState.Sword],
                result.stepsTo[TileState.Present]
              ),
              Fox: foxStep,
              totalSteps: maxStep,

              fullSword: result.stepsTo[TileState.Sword] + swordFullSteps,
              fullPresent: result.stepsTo[TileState.Present] + presentFullSteps,
              fullSwordPresent:
                Math.max(
                  result.stepsTo[TileState.Sword],
                  result.stepsTo[TileState.Present]
                ) +
                swordFullSteps +
                presentFullSteps,
              fullTotal:
                Math.max(
                  result.stepsTo[TileState.Sword],
                  result.stepsTo[TileState.Present],
                  foxStep
                ) +
                swordFullSteps +
                presentFullSteps,

              bestFox: bestFoxSteps.min,
              bestSwordFox: bestSwordFoxSteps.min,
              bestPresentFox: bestPresentFoxSteps.min,
              bestTotal: bestTotalSteps.min,

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
          assert(summary.stepsTo.bestTotal === summary.stepsTo.fullTotal);
          summaries.push(summary);
        }
      }
    }
  }

  const deduplicatedSummaries: AutoSolveResultSummary[] = [];

  {
    const deduplicatedSummariesMap = new Map<string, AutoSolveResultSummary>();

    for (const summary of summaries) {
      const key = `
      ${summary.blocked.join(",")}
      ${summary.pattern.Sword}${summary.pattern.Sword3x2}
      ${summary.pattern.Present}
      ${summary.foxIndex}
      |
      ${summary.stepsTo.totalSteps}
      ${summary.stepsTo[TileState.Sword]}
      ${summary.stepsTo[TileState.Present]}
      ${summary.stepsTo.fullTotal}
      ${summary.stepsTo.fullSword}
      ${summary.stepsTo.fullPresent}
      ${summary.stepsTo[TileState.Fox]}`;

      const existing = deduplicatedSummariesMap.get(key);
      if (existing !== undefined) {
        assert(
          existing.stepsTo[TileState.Sword] === summary.stepsTo[TileState.Sword]
        );
        assert(
          existing.stepsTo[TileState.Present] ===
            summary.stepsTo[TileState.Present]
        );
        assert(
          existing.stepsTo[TileState.Fox] === summary.stepsTo[TileState.Fox]
        );
        assert(existing.stepsTo.bestFox === summary.stepsTo.bestFox);
        assert(existing.stepsTo.totalSteps === summary.stepsTo.totalSteps);
        assert(existing.stepsTo.fullSword === summary.stepsTo.fullSword);
        assert(existing.stepsTo.fullPresent === summary.stepsTo.fullPresent);
        assert(existing.stepsTo.bestSwordFox === summary.stepsTo.bestSwordFox);
        assert(
          existing.stepsTo.fullSwordPresent === summary.stepsTo.fullSwordPresent
        );
        assert(
          existing.stepsTo.bestPresentFox === summary.stepsTo.bestPresentFox
        );
        assert(existing.stepsTo.fullTotal === summary.stepsTo.fullTotal);
      } else {
        deduplicatedSummariesMap.set(key, summary);
        deduplicatedSummaries.push(summary);
      }
    }
  }

  const totalBeforeDeduplication = summaries.length;
  const fullSummaries = summaries;
  summaries = deduplicatedSummaries;

  if (enableText) {
    /**
     * Summaries
     */
    const {
      mins,
      maxes,
      avgs,
    }: { mins: string[]; maxes: string[]; avgs: string[] } =
      printBreakdownSummaries(lines, summaries);

    /**
     * Group Self-check
     */
    printGroupsSelfCheck(summaries, lines);

    /**
     * Short-summaries
     */
    {
      type GroupValues = {
        min: AutoSolveResultSummary["stepsTo"];
        max: AutoSolveResultSummary["stepsTo"];
        minInSlot: AutoSolveResultSummary["stepsTo"];
        maxInSlot: AutoSolveResultSummary["stepsTo"];
      };
      const groups = new Map<string, GroupValues>();
      for (const summary of summaries) {
        const key = `${summary.identifier.charAt(0)} ${patternToPictograph(summary.pattern)}`;

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
        const printedCalculations: string[] = [];
        for (const [min, max] of [
          [values.min, values.max],
          [values.minInSlot, values.maxInSlot],
        ] as const) {
          printedCalculations.push(
            [
              indent(1),
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
            ].join(" ")
          );
        }
        if (printedCalculations[0] === printedCalculations[1]) {
          lines.unshift(`${printedCalculations[0]}`);
        } else {
          lines.unshift(`  Per: ${printedCalculations[1]}`);
          lines.unshift(`Total: ${printedCalculations[0]}`);
        }
        lines.unshift(patternKey);
      }
    }

    /**
     * Other metrics
     */

    lines.unshift("");
    const stepsAfterFox = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        `${
          summary.steps.length -
          (summary.steps.find((step) => step.state === TileState.Fox)
            ?.stepNumber ?? NaN)
        }`
    );
    printRollup(lines, stepsAfterFox, "count");
    lines.unshift("Steps after Fox found");

    lines.unshift("");
    const foxAtOrBefore = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        `${
          // If the fox is present (it should always be),
          // and the Fox's stepsTo is equal to the Sword or Present,
          // it means discovering the Fox also discovered the
          summary.steps.find((step) => step.state === TileState.Fox) !==
          undefined
            ? (summary.stepsTo.Fox <= summary.stepsTo[TileState.Sword]
                ? "Sword"
                : "") +
              (summary.stepsTo.Fox <= summary.stepsTo[TileState.Present]
                ? "Present"
                : "")
            : ""
        }`
    );
    printRollup(lines, foxAtOrBefore, "count");
    lines.unshift("Fox found before");

    lines.unshift("");
    const emptyStepsByPattern = calculateRollupSummary(
      summaries,
      (summary) =>
        summary.steps.filter(
          (step) =>
            step.stepNumber <= summary.stepsTo.SwordPresent &&
            step.state === TileState.Empty
        ).length,
      (summary) => summary.identifier
    );
    printRollup(lines, emptyStepsByPattern);
    lines.unshift("Empty Steps by Pattern to find Sword and Present");

    lines.unshift("");
    const emptySteps = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        summary.steps
          .filter(
            (step) =>
              step.stepNumber <= summary.stepsTo.SwordPresent &&
              step.state === TileState.Empty
          )
          .length.toString()
    );
    printRollup(lines, emptySteps, "count");
    lines.unshift("Empty Steps to find Sword and Present");

    lines.unshift("");
    const totalFoundDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => `${summary.stepsTo.totalSteps}`
    );
    printRollup(lines, totalFoundDistribution, "count");
    lines.unshift("Everything Found on Step");

    //#region Uncovered by step section

    lines.unshift("");
    const bestPresentFoxDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        summary.stepsTo.bestPresentFox > 11
          ? ">11"
          : summary.stepsTo.bestPresentFox
    );
    printRollup(lines, bestPresentFoxDistribution, "count", 3);
    lines.unshift(`${indent(2)}Present & Fox`);

    lines.unshift("");
    const bestSwordFoxDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        summary.stepsTo.bestSwordFox > 11 ? ">11" : summary.stepsTo.bestSwordFox
    );
    printRollup(lines, bestSwordFoxDistribution, "count", 3);
    lines.unshift(`${indent(2)}Sword & Fox`);

    lines.unshift("");
    const fullSwordPresentDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        summary.stepsTo.fullSwordPresent > 11
          ? ">11"
          : summary.stepsTo.fullSwordPresent
    );
    printRollup(lines, fullSwordPresentDistribution, "count", 3);
    lines.unshift(`${indent(2)}Sword & Present`);

    lines.unshift("");
    const fullTotalDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        summary.stepsTo.fullTotal > 11 ? ">11" : summary.stepsTo.fullTotal
    );
    printRollup(lines, fullTotalDistribution, "count", 3);
    lines.unshift(`${indent(2)}Sword, Present, & Fox`);

    lines.unshift("");
    const foxFoundDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => `${summary.stepsTo.Fox}`
    );
    printRollup(lines, foxFoundDistribution, "count", 3);
    lines.unshift(`${indent(2)}Fox`);
    lines.unshift("...uncovered by step");

    //#endregion

    lines.unshift("");
    const foxOptionsLe4 = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => summary.stepsTo.possibleFoxIndexes4
    );
    printRollup(lines, foxOptionsLe4, "count", 3);
    lines.unshift(`Steps to four or less Fox Spots`);

    lines.unshift("");
    const foxOptionsLe3 = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => summary.stepsTo.possibleFoxIndexes3
    );
    printRollup(lines, foxOptionsLe3, "count", 3);
    lines.unshift(`Steps to three or less Fox Spots`);

    lines.unshift("");
    const foxOptionsLe2 = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => summary.stepsTo.possibleFoxIndexes2
    );
    printRollup(lines, foxOptionsLe2, "count", 3);
    lines.unshift(`Steps to two or less Fox Spots`);

    lines.unshift("");
    const foxOptionsLe1 = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => summary.stepsTo.possibleFoxIndexes1
    );
    printRollup(lines, foxOptionsLe1, "count", 3);
    lines.unshift(`Steps to one or less Fox Spots`);

    lines.unshift("");
    const foxOptionsLe0 = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => summary.stepsTo.possibleFoxIndexes0
    );
    printRollup(lines, foxOptionsLe0, "count", 3);
    lines.unshift(`Steps to zero Fox Spots`);

    // lines.unshift("");
    // const foxFoundDistribution = calculateRollupSummary(
    //   summaries,
    //   () => 1,
    //   (summary) => `${summary.stepsTo.Fox}`
    // );
    // printRollup(lines, foxFoundDistribution, "count");
    // lines.unshift("Fox Found on Step");

    // lines.unshift("");
    // const swordPresentFoundDistribution = calculateRollupSummary(
    //   summaries,
    //   () => 1,
    //   (summary) => `${summary.stepsTo.SwordPresent}`
    // );
    // printRollup(lines, swordPresentFoundDistribution, "count");
    // lines.unshift("Sword & Present Found on Step");

    // lines.unshift("");
    // const presentFoundDistribution = calculateRollupSummary(
    //   summaries,
    //   () => 1,
    //   (summary) => `${summary.stepsTo[TileState.Present]}`
    // );
    // printRollup(lines, presentFoundDistribution, "count");
    // lines.unshift("Present Found on Step");

    // lines.unshift("");
    // const swordFoundDistribution = calculateRollupSummary(
    //   summaries,
    //   () => 1,
    //   (summary) => `${summary.stepsTo[TileState.Sword]}`
    // );
    // printRollup(lines, swordFoundDistribution, "count");
    // lines.unshift("Sword Found on Step");

    /**
     * Top-level rollups
     */
    lines.unshift("");
    lines.unshift(...mins);
    lines.unshift("");
    lines.unshift(...maxes);
    lines.unshift("");
    lines.unshift(...avgs);
    lines.unshift("");
    lines.unshift(`...variations calculated: ${shortCircuitTotal}`);
    lines.unshift(`...after deduplication: ${deduplicatedSummaries.length}`);
    lines.unshift(`...variations explored: ${totalBeforeDeduplication}`);
    lines.unshift("Total");
  }

  return {
    text: enableText ? lines.join("\n") : "",
    csv: enableCsv
      ? [
          "identifier",
          "pattern.Sword",
          "pattern.Sword3x2",
          "pattern.Present",
          "pattern.ConfirmedFoxes",
          "blocked[0]",
          "blocked[1]",
          "blocked[2]",
          "blocked[3]",
          "blocked[4]",
          "foxIndex",
          "stepsTo[TileState.Sword]",
          "stepsTo[TileState.Present]",
          "stepsTo.SwordPresent",
          "stepsTo.Fox",
          "stepsTo.totalSteps",
          "steps[0]",
          "steps[1]",
          "steps[2]",
          "steps[3]",
          "steps[4]",
          "steps[5]",
          "steps[6]",
          "steps[7]",
          "steps[8]",
          "steps[9]",
          "steps[10]",
        ].join(DELIMINATOR) +
        "\n" +
        summaries
          .map((summary) =>
            [
              summary.identifier,
              summary.pattern.Sword,
              summary.pattern.Sword3x2,
              summary.pattern.Present,
              summary.pattern.ConfirmedFoxes.join(","),
              summary.blocked[0],
              summary.blocked[1],
              summary.blocked[2],
              summary.blocked[3],
              summary.blocked[4],
              summary.foxIndex,
              summary.stepsTo[TileState.Sword],
              summary.stepsTo[TileState.Present],
              summary.stepsTo.SwordPresent,
              summary.stepsTo.Fox,
              summary.stepsTo.totalSteps,
              ...summary.steps.map(
                (step) =>
                  `${step.index.toString().padStart(2, " ")}->${step.state[0]}`
              ),
            ].join(DELIMINATOR)
          )
          .join("\n")
      : "",
  };
}

function expandedStepsTo(
  stepsTo: AutoSolveResultStepsTo,
  steps: AutoSolveResultStepTaken[],
  pattern: CommunityDataPattern
) {
  const swordFullSteps = steps.some((step) => step.state === TileState.Sword)
    ? 5
    : 6;
  const presentFullSteps = steps.some(
    (step) => step.state === TileState.Present
  )
    ? 3
    : 4;
  const stepWhereAllFoxLocationsFound = steps.find((step) =>
    step.foxCandidatesRemaining.every(
      ({ inPatterns }) => inPatterns === step.patternsRemaining.length
    )
  );
  for (const step of steps) {
    if (
      stepWhereAllFoxLocationsFound !== undefined &&
      step.stepNumber >= stepWhereAllFoxLocationsFound.stepNumber
    ) {
      break;
    }

    // We don't consider the case where there there are just a few patterns left
    // from different patterns (because this shouldn't happen with an optimal solve)
    assert(step.foxCandidatesRemaining.length >= 8);
  }
  assert(stepWhereAllFoxLocationsFound !== undefined);
  assert(stepWhereAllFoxLocationsFound.patternsRemaining.includes(pattern));
  const foundFoxAtStep = steps.find(
    (step) => step.state === TileState.Fox
  )?.stepNumber;
  const pointlessStepsAfterFoxLocationsFound = steps.filter(
    (step) =>
      step.stepNumber > stepWhereAllFoxLocationsFound.stepNumber &&
      (foundFoxAtStep === undefined || step.stepNumber < foundFoxAtStep) &&
      pattern.ConfirmedFoxes.includes(step.index) === false &&
      step.state !== TileState.Fox
  ).length;

  const bestFoxSteps = { min: -1, max: -1 };
  const bestSwordFoxSteps = { min: -1, max: -1 };
  const bestPresentFoxSteps = { min: -1, max: -1 };
  const bestTotalSteps = { min: -1, max: -1 };

  const stepsToFoxStart = stepWhereAllFoxLocationsFound.stepNumber;

  if (foundFoxAtStep === undefined) {
    const foxFullSteps = stepsTo.Fox.max - stepsTo.Fox.min;
    const minFoxSteps =
      stepWhereAllFoxLocationsFound.state === TileState.Fox ? 0 : 1;
    bestFoxSteps.min = stepWhereAllFoxLocationsFound.stepNumber + 1;
    bestFoxSteps.max =
      stepWhereAllFoxLocationsFound.stepNumber + foxFullSteps + 1;

    bestSwordFoxSteps.min =
      Math.max(stepsTo.Sword, stepsToFoxStart) + swordFullSteps + minFoxSteps;
    bestSwordFoxSteps.max =
      Math.max(stepsTo.Sword, stepsToFoxStart) +
      swordFullSteps +
      minFoxSteps +
      foxFullSteps;
    bestPresentFoxSteps.min =
      Math.max(stepsTo.Present, stepsToFoxStart) +
      presentFullSteps +
      minFoxSteps;
    bestPresentFoxSteps.max =
      Math.max(stepsTo.Present, stepsToFoxStart) +
      presentFullSteps +
      minFoxSteps +
      foxFullSteps;

    bestTotalSteps.min =
      Math.max(stepsTo.Sword, stepsTo.Present, stepsToFoxStart) +
      swordFullSteps +
      presentFullSteps +
      minFoxSteps;
    bestTotalSteps.max =
      Math.max(stepsTo.Sword, stepsTo.Present, stepsToFoxStart) +
      swordFullSteps +
      presentFullSteps +
      minFoxSteps +
      foxFullSteps;

    assert(foxFullSteps >= 0);
    assert(
      bestFoxSteps.min ===
        stepsTo.Fox.min - pointlessStepsAfterFoxLocationsFound
    );
    assert(
      bestFoxSteps.max ===
        stepsTo.Fox.max - pointlessStepsAfterFoxLocationsFound
    );
  } else {
    assert(foundFoxAtStep === stepsTo.Fox.min);
    assert(foundFoxAtStep === stepsTo.Fox.max);

    const usefulStepsAfterFoxLocationFound = steps.filter(
      (step) =>
        step.stepNumber > stepWhereAllFoxLocationsFound.stepNumber &&
        pattern.ConfirmedFoxes.includes(step.index)
    ).length;

    const foxFullSteps = usefulStepsAfterFoxLocationFound;
    bestFoxSteps.min = bestFoxSteps.max = stepsToFoxStart + foxFullSteps;

    bestSwordFoxSteps.min = bestSwordFoxSteps.max =
      Math.max(stepsTo.Sword, stepsToFoxStart) + swordFullSteps + foxFullSteps;

    bestPresentFoxSteps.min = bestPresentFoxSteps.max =
      Math.max(stepsTo.Present, stepsToFoxStart) +
      presentFullSteps +
      foxFullSteps;

    bestTotalSteps.min = bestTotalSteps.max =
      Math.max(stepsTo.Sword, stepsTo.Present, stepsToFoxStart) +
      swordFullSteps +
      presentFullSteps +
      foxFullSteps;

    assert(bestFoxSteps.min === bestFoxSteps.max);
    assert(
      bestFoxSteps.min + pointlessStepsAfterFoxLocationsFound ===
        stepsTo.Fox.min
    );
    if (stepWhereAllFoxLocationsFound.state === TileState.Fox) {
      assert(usefulStepsAfterFoxLocationFound === 0);
      assert(foxFullSteps === 0);
    } else {
      assert(foxFullSteps > 0);
    }
  }

  assert(bestFoxSteps.min > 0);
  assert(bestFoxSteps.max > 0);
  assert(bestSwordFoxSteps.min > 0);
  assert(bestSwordFoxSteps.max > 0);
  assert(bestSwordFoxSteps.min > 0);
  assert(bestSwordFoxSteps.max > 0);
  assert(bestTotalSteps.min > 0);
  assert(bestTotalSteps.max > 0);

  return {
    swordFullSteps,
    presentFullSteps,

    bestFoxSteps,
    bestSwordFoxSteps,
    bestPresentFoxSteps,
    bestTotalSteps,
  };
}

function printRollup(
  lines: string[],
  rollups: ReturnType<typeof calculateRollupSummary>,
  mode: "value" | "count" = "value",
  identLevel = 2
) {
  const keyLen = Array.from(rollups.keys()).reduce(
    (p: number, c) => Math.max(p, `${c}`.length),
    0
  );
  const totalTotalCount = calculateRollupTotalTotalCount(rollups);
  for (const [rollupKey, rollupData] of Array.from(rollups.entries()).sort(
    ([a], [b]) => {
      if (typeof a === "string" && typeof b === "string") {
        return b.localeCompare(a);
      }
      if (typeof a === "number" && typeof b === "number") {
        return b - a;
      }
      if (typeof a === "number") {
        return 1;
      }
      return -1;
    }
  )) {
    lines.unshift(
      `${indent(identLevel)}${rollupKey.toString().padEnd(keyLen, " ")} -> ${stringifyRollupSummary(mode, totalTotalCount, rollupData)}`
    );
  }
}

function calculateRollupTotalTotalCount(
  rollups: ReturnType<typeof calculateRollupSummary>
) {
  return Array.from(rollups.values()).reduce((p, c) => p + c.totalCount, 0);
}

function stringifyRollupSummary(
  mode: "value" | "count",
  totalTotalCount: number,
  summary: RollupSummary
) {
  const valueData = `Min ${summary.min} | Max ${summary.max} | Avg ${formatter.format(summary.totalCount / summary.total)}`;
  return (
    (mode === "value" ? valueData + " | " : "") +
    `Total ${formatterPercent.format(summary.totalCount / totalTotalCount).padStart(7, " ")} | Total ${summary.totalCount.toString().padStart(6, " ")}`
  );
}

function printGroupsSelfCheck(
  summaries: AutoSolveResultSummary[],
  lines: string[]
) {
  const totalByIdentifier = calculateRollupSummary(
    summaries,
    "totalSteps",
    (summary) => summary.identifier
  );

  const abcdLines = {
    A: [] as string[],
    B: [] as string[],
    C: [] as string[],
    D: [] as string[],
  };
  const totalsTotalsByIdentifier =
    calculateRollupTotalTotalCount(totalByIdentifier);
  for (const [identifier, totals] of totalByIdentifier) {
    const letter = `${identifier}`[0];
    assert(
      letter === ("A" as const) ||
        letter === ("B" as const) ||
        letter === ("C" as const) ||
        letter === ("D" as const)
    );
    abcdLines[letter].push(
      `${identifier.toString().padEnd(2, " ")} ${stringifyRollupSummary("value", totalsTotalsByIdentifier, totals)}`
    );
  }

  lines.unshift("");
  for (const key of ["D", "C", "B", "A"] as const) {
    lines.unshift(
      `${indent(2)}${key}`,
      abcdLines[key]
        .sort()
        .map((l) => `${indent(3)}${l}`)
        .join("\n")
    );
  }
  lines.unshift(
    "Group self-check (all rows in a group [groups being A,B,C,D] should be the same)"
  );
}

function printBreakdownSummaries(
  lines: string[],
  summaries: AutoSolveResultSummary[]
) {
  const avgs: string[] = [];
  const mins: string[] = [];
  const maxes: string[] = [];
  const rowLabelPad = 25;
  function printSummary(
    title: string,
    lookup: keyof AutoSolveResultSummary["stepsTo"]
  ) {
    const {
      avg,
      min,
      max,
      lines: summaryLines,
    } = printRowsAndCalculateRollups(
      groupByStepCountLetterAndIdentifier(summaries, lookup)
    );
    lines.unshift(...summaryLines);
    lines.unshift(title);

    avgs.push(
      `${title.padStart(rowLabelPad, " ")}: ${formatter.format(avg).padStart(8, " ")}`
    );
    mins.push(
      `${title.padStart(rowLabelPad, " ")}: ${min.toString().padStart(8, " ")}`
    );
    maxes.push(
      `${title.padStart(rowLabelPad, " ")}: ${max.toString().padStart(8, " ")}`
    );
  }

  lines.unshift("");

  avgs.push("Average Steps to Find");
  mins.push("Minimum Steps to Find");
  maxes.push("Maximum Steps to Find");
  printSummary("Sword", TileState.Sword);
  printSummary("Present", TileState.Present);
  printSummary("Sword & Present", "SwordPresent");

  printSummary("Fox last", "Fox");
  printSummary("Fox first", "bestFox");
  printSummary("Four or less Fox Spots", "possibleFoxIndexes4");
  printSummary("Three or less Fox Spots", "possibleFoxIndexes3");
  printSummary("Two or less Fox Spots", "possibleFoxIndexes2");
  printSummary("One or less Fox Spots", "possibleFoxIndexes1");
  printSummary("Zero Fox Spots", "possibleFoxIndexes0");

  printSummary("All", "totalSteps");

  avgs.push("\nAverage Steps to Uncover");
  mins.push("\nMinimum Steps to Uncover");
  maxes.push("\nMaximum Steps to Uncover");

  printSummary("Sword", "fullSword");
  printSummary("Present", "fullPresent");

  printSummary("Sword & Present", "fullSwordPresent");

  printSummary("Sword & Fox", "bestSwordFox");
  printSummary("Present & Fox", "bestPresentFox");

  printSummary("All", "fullTotal");

  return { mins, maxes, avgs };
}

function groupByStepCountLetterAndIdentifier(
  summaries: AutoSolveResultSummary[],
  lookup: keyof AutoSolveResultSummary["stepsTo"]
) {
  const byStep = new Map<number, Map<string, Map<string, number>>>();

  for (const summary of summaries) {
    const stepCount = summary.stepsTo[lookup];
    const step =
      byStep.get(stepCount) ?? new Map<string, Map<string, number>>();
    const identKey = summary.identifier[0];
    assert(identKey !== undefined);
    const ident = step.get(identKey) ?? new Map<string, number>();
    ident.set(summary.identifier, (ident.get(summary.identifier) ?? 0) + 1);
    step.set(identKey, ident);
    byStep.set(stepCount, step);
  }

  return byStep;
}

interface RollupSummary {
  total: number;
  totalCount: number;
  min: number;
  max: number;
}

function calculateRollupSummary(
  summaries: AutoSolveResultSummary[],
  lookup:
    | keyof AutoSolveResultSummary["stepsTo"]
    | ((summary: AutoSolveResultSummary) => number),
  groupByFn: (summary: AutoSolveResultSummary) => string | number
) {
  const lookupFn =
    typeof lookup === "string"
      ? (summary: AutoSolveResultSummary) => summary.stepsTo[lookup]
      : lookup;

  const byGroup = new Map<string | number, RollupSummary>();

  for (const summary of summaries) {
    const value = lookupFn(summary);
    const groupKey = groupByFn(summary);

    let groupData = byGroup.get(groupKey);
    if (groupData === undefined) {
      groupData = {
        total: 0,
        totalCount: 0,
        min: value,
        max: value,
      };
      byGroup.set(groupKey, groupData);
    }

    groupData.totalCount += 1;
    groupData.total += value;
    groupData.min = Math.min(groupData.min, value);
    groupData.max = Math.max(groupData.max, value);
  }

  return byGroup;
}

function printRowsAndCalculateRollups(
  groups: Map<number, Map<string, Map<string, number>>>
) {
  const lines: string[] = [];
  let totalSteps = 0;
  let totalCount = 0;
  let min = Number.MAX_SAFE_INTEGER;
  let max = -1;
  for (const [stepCount, data] of Array.from(groups).sort(
    ([a], [b]) => a - b
  )) {
    min = Math.min(min, stepCount);
    max = Math.max(max, stepCount);

    let totalCountForStepCount = 0;
    lines.push(`${indent(1)}Steps: ${stepCount}`);
    for (const [, idents] of Array.from(data).sort(([a], [b]) =>
      a.localeCompare(b)
    )) {
      lines.push(
        indent(2) +
          Array.from(idents)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(
              ([identifier, count]) =>
                `${identifier.padEnd(2, " ")} ${("x" + count).padStart(10, " ")}`
            )
            .join(" | ")
      );
      totalCountForStepCount += Array.from(idents.values()).reduce(
        (p, c) => p + c,
        0
      );
    }
    totalCount += totalCountForStepCount;
    totalSteps += totalCountForStepCount * stepCount;
  }
  const avg = totalSteps / totalCount;
  lines.push(`Average steps: ${formatter.format(avg)}`);
  lines.push("");
  return { lines, avg, min, max, totalCount };
}

function stringifyMinMax(
  prefix: string,
  { min, max }: { min: number; max: number }
) {
  return min === max ? `${prefix}${min}` : `${prefix}[${min},${max}]`;
}

function indent(level: number) {
  return " ".repeat(level * 2);
}
