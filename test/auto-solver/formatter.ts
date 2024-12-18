import { TileState } from "~/src/game/types/tile-states.js";
import { AutoSolveIdentifierSet } from "./auto-solver.js";
import { generateSummaries } from "./generate-summaries.js";
import { printAutoSolveSets } from "./printers/print-auto-solve-sets.js";
import { DELIMINATOR, indent } from "./printers/helpers.js";
import { deduplicateSummaries } from "./deduplicate-summaries.js";
import { printFullExpandedResultSummary } from "./printers/print-expanded-result-summary-full.js";
import { printRollup } from "./printers/print-rollup.js";
import { calculateRollupSummary } from "./calculators/rollup-summary.js";
import { printPatternSummaries } from "./printers/print-pattern-summaries.js";

export function stringifyAutoSolveResults(
  results: Record<string, AutoSolveIdentifierSet>,
  { enableText, enableCsv }: { enableText: boolean; enableCsv: boolean } = {
    enableText: true,
    enableCsv: false,
  }
): { text: string; csv: string } {
  const { summaries: fullSummaries, shortCircuitTotal } =
    generateSummaries(results);

  const deduplicatedSummaries = deduplicateSummaries(fullSummaries);

  const totalBeforeDeduplication = fullSummaries.length;
  const summaries = deduplicatedSummaries;
  const worseFoxSummaries = deduplicateSummaries(
    summaries.filter((s) => s.steps.some((step) => step.worstFox === true))
  );

  const lines: string[] = [];
  if (enableText) {
    /**
     * Top-level rollups
     */
    lines.push("Total");
    lines.push(`...variations explored: ${totalBeforeDeduplication}`);
    lines.push(`...after deduplication: ${deduplicatedSummaries.length}`);
    lines.push(`...variations calculated: ${shortCircuitTotal}`);

    /**
     * Summaries
     */
    printFullExpandedResultSummary(lines, [
      { title: "", summaries },
      { title: "NoFox", summaries: worseFoxSummaries },
    ]);

    /**
     * Other metrics
     */

    lines.push("");
    lines.push("Steps after Fox found");
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

    lines.push("");
    lines.push("Fox found before");
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

    lines.push("");
    lines.push("Empty Steps by Pattern to find Sword and Present");
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

    lines.push("");
    lines.push("Empty Steps to find Sword and Present");
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

    lines.push("");
    lines.push("Everything Found on Step");
    const totalFoundDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => `${summary.stepsTo.totalSteps}`
    );
    printRollup(lines, totalFoundDistribution, "count");

    //#region Uncovered by step section

    lines.push("");
    lines.push(`${indent(2)}Present & Fox`);
    const bestPresentFoxDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        summary.stepsTo.bestPresentFox > 11
          ? ">11"
          : summary.stepsTo.bestPresentFox
    );
    printRollup(lines, bestPresentFoxDistribution, "count", 3);

    lines.push("");
    lines.push(`${indent(2)}Sword & Fox`);
    const bestSwordFoxDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        summary.stepsTo.bestSwordFox > 11 ? ">11" : summary.stepsTo.bestSwordFox
    );
    printRollup(lines, bestSwordFoxDistribution, "count", 3);

    lines.push("");
    lines.push(`${indent(2)}Sword & Present`);
    const fullSwordPresentDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        summary.stepsTo.fullSwordPresent > 11
          ? ">11"
          : summary.stepsTo.fullSwordPresent
    );
    printRollup(lines, fullSwordPresentDistribution, "count", 3);

    lines.push("");
    lines.push(`${indent(2)}Sword, Present, & Fox`);
    const fullTotalDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) =>
        summary.stepsTo.fullTotal > 11 ? ">11" : summary.stepsTo.fullTotal
    );
    printRollup(lines, fullTotalDistribution, "count", 3);

    lines.push("");
    lines.push(`${indent(2)}Fox`);
    lines.push("...uncovered by step");
    const foxFoundDistribution = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => `${summary.stepsTo.Fox}`
    );
    printRollup(lines, foxFoundDistribution, "count", 3);

    //#endregion

    lines.push("");
    lines.push(`Steps to four or less Fox Spots`);
    const foxOptionsLe4 = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => summary.stepsTo.possibleFoxIndexes4
    );
    printRollup(lines, foxOptionsLe4, "count", 3);

    lines.push("");
    lines.push(`Steps to three or less Fox Spots`);
    const foxOptionsLe3 = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => summary.stepsTo.possibleFoxIndexes3
    );
    printRollup(lines, foxOptionsLe3, "count", 3);

    lines.push("");
    lines.push(`Steps to two or less Fox Spots`);
    const foxOptionsLe2 = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => summary.stepsTo.possibleFoxIndexes2
    );
    printRollup(lines, foxOptionsLe2, "count", 3);

    lines.push("");
    lines.push(`Steps to one or less Fox Spots`);
    const foxOptionsLe1 = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => summary.stepsTo.possibleFoxIndexes1
    );
    printRollup(lines, foxOptionsLe1, "count", 3);

    lines.push("");
    lines.push(`Steps to zero Fox Spots`);
    const foxOptionsLe0 = calculateRollupSummary(
      summaries,
      () => 1,
      (summary) => summary.stepsTo.possibleFoxIndexes0
    );
    printRollup(lines, foxOptionsLe0, "count", 3);

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

    // {
    //   lines.push("");
    //   lines.push(
    //     "Checking for cases where there are 4 or less fox candidates remaining AND subquent moves do not reduce the number of fox candidates by at least one."
    //   );
    //   lines.push(
    //     "The goal of this step is to validate the advice that, when there are four or less foxes, continuing to solve for the location of the other shapes has no downsides."
    //   );
    //   let anyIssues = false;
    //   for (const summary of summaries) {
    //     let startChecking = false;
    //     let lastStepCandidatesRemaining: number = -1;
    //     // if (
    //     //   summary.identifier === "A←" &&
    //     //   summary.pattern.Sword === 2 &&
    //     //   summary.pattern.Sword3x2 === true
    //     // ) {
    //     //   console.log("????");
    //     //   debugger;
    //     // }
    //     for (const step of summary.steps) {
    //       if (!startChecking) {
    //         if (
    //           step.foxCandidatesRemaining.length > 4 ||
    //           step.foxCandidatesRemaining.length < 1
    //         ) {
    //           continue;
    //         }

    //         if (step.solvedPresent && step.solvedSword) {
    //           break;
    //         }
    //         startChecking = true;
    //         lastStepCandidatesRemaining = step.foxCandidatesRemaining.length;
    //       } else {
    //         if (
    //           lastStepCandidatesRemaining >= step.foxCandidatesRemaining.length
    //         ) {
    //           lines.push(
    //             `${indent(2)}${summary.identifier}${patternToPictograph(summary.pattern)} on step #${step.stepNumber}, fox candidates remaining was ${step.foxCandidatesRemaining.length} and on the prior step it was ${lastStepCandidatesRemaining} |-> ${printSteps(summary.steps)}`
    //           );
    //           anyIssues = true;
    //           break;
    //         }
    //         lastStepCandidatesRemaining = step.foxCandidatesRemaining.length;
    //       }
    //     }
    //   }

    //   if (!anyIssues) {
    //     lines.push(
    //       `${indent(2)}No cases found (this means the advice is correct)`
    //     );
    //   }
    // }

    lines.push("");
    lines.push(
      "Below this point is more detailed breakdowns of the solve calculations performed on each identifier."
    );
    lines.push(
      "This is very verbose, and mostly intended for understanding how a specific result was reached for development purposes,"
    );
    lines.push("as well as regression testing.");
    lines.push("");
    lines.push("Legend");
    {
      lines.push(`
  Each possible pattern is uniquely identified by the identifier (from the community data spreadsheet, e.g. D→)
    and the location of the Sword and Present (e.g. ▭14 ◻24 or ▯22 ◻25).
    The locations are the index (zero-based, row-major order[1]) of the top-left most corner of the shape, Sword then Present.
      > [1] If you're not sure what this means, count the tiles starting with the top-left tile being zero, moving left to right like reading a book.
    The Sword's orientation is represented by either ▭ or ▯.

  The following lines use the a space separated list of metrics, where each metric is divided into a metric identifier and then the minimum and maximum steps for that metric.
  Metric Identifiers:
     T - Total number of steps to fully uncover everything on the board (including finding the fox)
     t - Total number of steps to fully solve the board (including finding the fox)
     s - Total number of steps to find the Sword
         + Total number of steps to fully uncover the Sword after finding it
     p - Total number of steps to find the Present
         + Total number of steps to fully uncover the Present after finding it
    SP - Total number of steps to fully uncover the Sword and Present
     F - Total number of steps to uncover the Fox
    SF - Total number of steps to fully uncover the Sword and Fox
    PF - Total number of steps to fully uncover the Present and Fox

  Minimum and maximum steps are themselves represented as either a single number or a range inside of [].
    For example:
          3 - 3 steps
      [3,6] - Between 3 and 6 steps
  
  Putting this all together, let's look at an example:
  T[11,15] t[3,6] s1+5 p2+[3,4] SP[10,11] F[2,5] SF[7,10] PF[6,10]

  T[11,15]  - The total number of steps to fully uncover everything on this board (including finding the fox)
              is between 11 and 15 steps [2].
  t[3,6]    - The total number of steps to fully solve the board (including finding the fox)
              is between 3 and 6 steps.
  s1+5      - The total number of steps to find the Sword is 1 steps,
              and then to uncover the rest of the Sword is another 5 steps.
  p2+[3,4]  - The total number of steps to find the Present is 2 steps,
              and then to uncover the rest of the Present is between 3 and 4 steps.
  SP[10,11] - The total number of steps to fully uncover the Sword and Present
              is between 10 and 11 steps.
  F[2,5]    - The total number of steps to uncover the Fox
              is between 2 and 5 steps.
  SF[7,10]  - The total number of steps to fully uncover the Sword and Fox
              is between 7 and 10 steps.
  PF[6,10]  - The total number of steps to fully uncover the Present and Fox
              is between 6 and 10 steps.

  [2] You may wonder why the range is 4 steps here
      (for an individual pattern, the only variance should be due to fox variance,
        which should be a maximum of 3 because it always takes at least 1 to find the fox).
      This example is from a summary of all possible solves for D→ ▭14 ◻24
      Looking at the individual solves, the range is [11,14] or [12,15], which when combined results in this wider range.
      
      This is correct because this summary is really representing two lines of data in one, the best and worst case.
`);
    }

    /**
     * Short-summaries
     */
    lines.push("");
    lines.push("Per-pattern summaries");
    printPatternSummaries(lines, summaries);

    /**
     * Full sets
     */
    lines.push("");
    lines.push("Full solve results");
    printAutoSolveSets(lines, results);
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
