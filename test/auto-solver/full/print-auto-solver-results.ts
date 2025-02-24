import fs from "node:fs";
import { communityDataByIdentifier } from "~/src/game/generated-community-data.js";
import {
  assertDefined,
  assertEqual,
  assertUnreachable,
} from "~/src/helpers.js";
import { indent, patternToPictograph } from "~/test/helpers/print-helpers.js";
import { CommunityDataPattern } from "~/src/game/types/community-data.js";
import path from "node:path";
import { crossCheckRotations } from "./result-validators/cross-check-rotations.js";
import { AutoSolverCollapsedPossibilityItem } from "./types/collapsed-possibilities.js";
import { printShortCircuitSolveResults } from "./printers/print-short-circuit-solve-results.js";
import {
  ExtendedAutoSolveRollups,
  generateRollups,
  rollupFoxNoFox,
} from "./helpers/generate-rollups.js";
import { printStrategyPercents } from "./printers/print-strategy-percents.js";
import {
  printCalculation,
  printPatternSummary,
} from "./printers/print-pattern-summaries.js";
import {
  AutoSolveStrategyResult,
  ExtendedAutoSolveStrategyResult,
} from "./types/solve-result.js";
import {
  STRATEGY_SwordPresent,
  STRATEGY_SwordFox,
  STRATEGY_PresentFox,
  STRATEGY_Fox,
  STRATEGY_All,
} from "./types/strategies.js";
import { printHighlights } from "./printers/print-highlights.js";
import { printHighlightsNormalized } from "./printers/print-highlights-normalized.js";
import { printStrategyPercentsNormalized } from "./printers/print-strategy-percents-normalized.js";
import { OnlyFoxNoFox } from "./types/fox-no-fox.js";

export function printAutoSolverResults(intermediaryResultsDir: string) {
  const files = fs
    .readdirSync(intermediaryResultsDir)
    .map((fileName) => path.join(intermediaryResultsDir, fileName));

  const deduplicator = new Map<string, ExtendedAutoSolveStrategyResult>();

  /**
   * Exact patterns, e.g. B← ▭27 ◻24
   */
  const patternGroups = new Map<string, ExtendedAutoSolveStrategyResult[]>();
  const dedupPatternGroups = new Map<
    string,
    ExtendedAutoSolveStrategyResult[]
  >();
  /**
   * Identifiers, e.g. B←
   */
  const identifierGroups = new Map<string, ExtendedAutoSolveStrategyResult[]>();

  /**
   * Identifiers (equivalent chains deduplicated)
   */
  const dedupIdentifierGroups = new Map<
    string,
    ExtendedAutoSolveStrategyResult[]
  >();

  /**
   * Everything
   */
  const allResults: ExtendedAutoSolveStrategyResult[] = [];

  /**
   * Everything (equivalent chains deduplicated)
   */
  const dedupAllResults: ExtendedAutoSolveStrategyResult[] = [];

  const allIds = new Set<string>();

  const collapsedPossibilities = new Map<
    CommunityDataPattern,
    AutoSolverCollapsedPossibilityItem
  >();

  for (const file of files) {
    console.log(file);
    const result = fs
      .readFileSync(file, { encoding: "utf-8" })
      .split("\n")
      .map((l) =>
        l.startsWith("{")
          ? (JSON.parse(l) as AutoSolveStrategyResult)
          : undefined
      )
      .filter((l) => l !== undefined);

    for (const item of result) {
      const identifierPatterns = communityDataByIdentifier[item.identifier];
      assertDefined(identifierPatterns);

      const pattern = identifierPatterns.Patterns.find(
        (p) => patternToPictograph(p) === item.pattern
      );
      assertDefined(pattern);

      const identifierKey =
        item.identifier.length === 1 ? `${item.identifier}↑` : item.identifier;
      allIds.add(identifierKey);
      const mergedIdentifierKey = item.identifier[0];
      assertDefined(mergedIdentifierKey);
      const patternKey = `${identifierKey} ${item.pattern}`;
      const processedItem: ExtendedAutoSolveStrategyResult = {
        ...item,
        identifier: item.identifier,
        patternData: pattern,
        strategy: cmpArrays(item.strategy, STRATEGY_SwordPresent)
          ? STRATEGY_SwordPresent
          : cmpArrays(item.strategy, STRATEGY_SwordFox)
            ? STRATEGY_SwordFox
            : cmpArrays(item.strategy, STRATEGY_PresentFox)
              ? STRATEGY_PresentFox
              : cmpArrays(item.strategy, STRATEGY_Fox)
                ? STRATEGY_Fox
                : cmpArrays(item.strategy, STRATEGY_All)
                  ? STRATEGY_All
                  : assertUnreachable(),
      };

      const patternExisting = patternGroups.get(patternKey) ?? [];
      patternExisting.push(processedItem);
      patternGroups.set(patternKey, patternExisting);

      const identifierExisting = identifierGroups.get(identifierKey) ?? [];
      identifierExisting.push(processedItem);
      identifierGroups.set(identifierKey, identifierExisting);

      allResults.push(processedItem);

      const deduplicationKey = `${item.identifier}${item.pattern},${item.foxIndex}
|${item.steps.map((step) => `${step.state[0]}${step.foxCandidates},${step.patternsRemaining?.sort().join("")}`).join("")}
|s${item.FoundSword}p${item.FoundPresent}S${item.UncoverSword}P${item.UncoverPresent}F${item.UncoverFox}
|${item.strategy.map((s) => s[0]).join("")}`;

      const duplicate = deduplicator.has(deduplicationKey);

      if (!duplicate) {
        deduplicator.set(deduplicationKey, processedItem);

        const dedupPatternExisting = dedupPatternGroups.get(patternKey) ?? [];
        dedupPatternExisting.push(processedItem);
        dedupPatternGroups.set(patternKey, dedupPatternExisting);

        const dedupIdentifierExisting =
          dedupIdentifierGroups.get(identifierKey) ?? [];
        dedupIdentifierExisting.push(processedItem);
        dedupIdentifierGroups.set(identifierKey, dedupIdentifierExisting);

        dedupAllResults.push(processedItem);
      }

      const collapsedPossibilityItem = collapsedPossibilities.get(pattern) ?? {
        Everything: [],
        All: [],
        PresentFox: [],
        SwordFox: [],
        SwordPresent: [],
        Fox: [],
      };

      collapsedPossibilityItem.Everything.push(processedItem);
      switch (processedItem.strategy) {
        case STRATEGY_All: {
          collapsedPossibilityItem.All.push(processedItem);
          break;
        }
        case STRATEGY_SwordPresent: {
          collapsedPossibilityItem.SwordPresent.push(processedItem);
          break;
        }
        case STRATEGY_SwordFox: {
          collapsedPossibilityItem.SwordFox.push(processedItem);
          break;
        }
        case STRATEGY_PresentFox: {
          collapsedPossibilityItem.PresentFox.push(processedItem);
          break;
        }
        case STRATEGY_Fox: {
          collapsedPossibilityItem.Fox.push(processedItem);
          break;
        }
        default: {
          assertUnreachable();
        }
      }
      collapsedPossibilities.set(pattern, collapsedPossibilityItem);
    }
  }

  crossCheckRotations(identifierGroups);

  const dedupPatternPartitions = {
    noFox: new Map(
      Array.from(dedupPatternGroups.entries()).map(([pattern, items]) => {
        const result = generateRollups(
          items.filter((item) => item.foxIndex === undefined)
        );
        assertDefined(result);
        return [pattern, result];
      })
    ),
    onlyFox: new Map(
      Array.from(dedupPatternGroups.entries()).map(([pattern, items]) => {
        const result = generateRollups(
          items.filter((item) => item.foxIndex !== undefined)
        );
        assertDefined(result);
        return [pattern, result];
      })
    ),
  };

  assertEqual(
    dedupPatternPartitions.noFox.size,
    dedupPatternPartitions.onlyFox.size
  );

  const introLines = [
    "",

    `The following identifiers were evaluated:\n${indent(1)}${Array.from(allIds.keys()).join(", ")}`,
    `${indent(1)}"All" refers to just these`,
    "",

    `Total
........solves checked: ${allResults.length}
...after deduplication: ${dedupAllResults.length}
....after partitioning: ${dedupPatternPartitions.onlyFox.size}

`,
  ];

  const highlightNormalizedLines: string[] = [];
  const highlightLines: string[] = [];
  const highLevelSummariesNormalizedLines: string[] = [];
  const highLevelSummariesLines: string[] = [];
  const detailedLines: string[] = [];
  const verboseLines: string[] = [];

  // All

  printPatternSummaryFoxNoFox({
    highlightNormalizedLines,
    highlightLines,
    highLevelSummariesNormalizedLines,
    highLevelSummariesLines,
    detailedLines,
    key: `All`,
    patternGroup: dedupAllResults,
    patternPartitions: dedupPatternPartitions,
  });
  detailedLines.push("");

  // Identifiers
  for (const [key, patternGroup] of Array.from(dedupIdentifierGroups).sort(
    ([a], [b]) => a.localeCompare(b)
  )) {
    printPatternSummaryFoxNoFox({
      highlightLines: key[1] === "↑" ? highlightLines : undefined,
      highlightNormalizedLines:
        key[1] === "↑" ? highlightNormalizedLines : undefined,
      highLevelSummariesLines,
      highLevelSummariesNormalizedLines,
      detailedLines,
      key: `Rollup of ${key}`,
      patternGroup,
      patternPartitions: {
        onlyFox: new Map(
          Array.from(dedupPatternPartitions.onlyFox.entries()).filter(
            ([partitionKey]) => partitionKey.startsWith(key)
          )
        ),
        noFox: new Map(
          Array.from(dedupPatternPartitions.noFox.entries()).filter(
            ([partitionKey]) => partitionKey.startsWith(key)
          )
        ),
      },
    });
  }
  verboseLines.push("");
  verboseLines.push(
    "Below this point is more detailed breakdowns of the solve calculations performed on each identifier."
  );
  verboseLines.push(
    "This is very verbose, and mostly intended for understanding how a specific result was reached for development purposes,"
  );
  verboseLines.push("as well as regression testing.");
  verboseLines.push("");
  verboseLines.push("Legend");
  {
    verboseLines.push(`
Each possible pattern is uniquely identified by the identifier (from the community data spreadsheet, e.g. D→)
  and the location of the Sword and Present (e.g. ▭14 ◻24 or ▯22 ◻25).
  The locations are the index (zero-based, row-major order[1]) of the top-left most corner of the shape, Sword then Present.
    > [1] If you're not sure what this means, count the tiles starting with the top-left tile being zero, moving left to right like reading a book.
  The Sword's orientation is represented by either ▭ or ▯.

The following lines use the a space separated list of metrics, where each metric is divided into a metric identifier and then the minimum and maximum steps for that metric.
Metric Identifiers:
   T - Total number of steps to fully uncover everything on the board (including finding the fox or uncovering all fox candidate tiles)
   t - Total number of steps to fully solve the board (including narrowing the fox candidate tiles down to 4 or less [or finding the fox])
   s - Total number of steps to find the Sword
   S - Total number of steps to fully uncover the Sword
   p - Total number of steps to find the Present
   P - Total number of steps to fully uncover the Present
  SP - Total number of steps to fully uncover the Sword and Present
   F - Total number of steps to uncover the Fox
  SF - Total number of steps to fully uncover the Sword and Fox
  PF - Total number of steps to fully uncover the Present and Fox

Minimum and maximum steps are themselves represented as either a single number or a range inside of [].
  For example:
        3 - 3 steps
    [3,6] - Between 3 and 6 steps (note: every step between may not be possible, this is purely the minimum and maximum)

Putting this all together, let's look at some examples:

T[11,15]  - The total number of steps to fully uncover everything on this board (including finding the fox)
            is between 11 and 15 steps [2].
t[3,6]    - The total number of steps to fully solve the board (including finding the fox)
            is between 3 and 6 steps.
s1        - The total number of steps to find the Sword is 1 steps,
S6        - The total number of steps to fully uncover the Sword is 6 steps.
p2        - The total number of steps to find the Present is 2 steps,
P[5,6]    - The total number of steps to fully uncover the Present is between 5 and 6 steps.
SP[10,11] - The total number of steps to fully uncover the Sword and Present
            is between 10 and 11 steps.
F[2,5]    - The total number of steps to uncover the Fox
            is between 2 and 5 steps.
SF[7,10]  - The total number of steps to fully uncover the Sword and Fox
            is between 7 and 10 steps.
PF[6,10]  - The total number of steps to fully uncover the Present and Fox
            is between 6 and 10 steps.

[2] You may wonder why the range is 4 steps here
    (for an individual solve, the only variance should be due to fox variance,
      which should be a maximum of 3 because it always takes at least 1 to find the fox).
    This example is from a summary of all possible solves for D→ ▭14 ◻24
    Looking at the individual solves, the range is [11,14] or [12,15], which when combined results in this wider range.
    
    This is correct because this summary is really representing two lines of data in one, the best and worst case.
`);
  }

  // Per-pattern summaries (details only)
  verboseLines.push("Per-pattern summaries");
  for (const [key, patternGroup] of Array.from(patternGroups).sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    printPatternSummaryFoxNoFox({
      key,
      patternGroup,
      detailedLines: verboseLines,
    });
  }

  verboseLines.push("");
  verboseLines.push(
    `Below this point is even more detailed breakdowns of the every possible combinations of steps to find the Sword+Present and the step statistics for them.`
  );
  verboseLines.push("");
  verboseLines.push(`The syntax is similar to the prior section, notable additions:
The steps themselves are shown as the "header" for a group followed by the results for various strategies:
22->S, 0->P
├ T[11,14] t[3,6] s1+5 p2+3
├ SP10 sp2
╰ PF[6,9]

The steps are just tileIndex->actualState (so in the above example, we uncovered 22 and found a Sword, then uncovered 0 and found a Present).

You'll note the steps stop short of actually finding the fox, this is mainly because most patterns end with there being 4 fox locations to try.
Every permutation of that is 4! (4 factorial, or 24).
This is on top of possible variations in getting to the point where just the 4 fox locations are left, which often don't matter
(for example, if there is two remaining Present locations that is often 8 possible options [all possible squares are equal], so now it's 8 * 24 = 192).

So, to temper the number of lines these results are grouped by just the steps needed to find the Sword and Present.

Also, s S p P from the previous section are combined into s+ and p+ (e.g. s1+5 p2+3) where the first number is the steps to find,
and the second number is the additional steps to uncover. This is not done in the previous section because it is possible for there to be a range
of values (e.g. s[1,2]+[5,6]) which can result in misleading information (e.g. per that example, it might be s1+6 s2+5).
That is not a problem here because we are looking at exactly one set of moves to find the Sword and Present at a time.
    `);
  verboseLines.push("");
  verboseLines.push("Full solve results");
  printShortCircuitSolveResults(verboseLines, collapsedPossibilities);

  return (
    introLines.join("\n") +
    "Overview (unique outcomes, pattern normalized)\n" +
    formatLines(highlightNormalizedLines) +
    "High-level summaries (unique outcomes, pattern normalized)\n\n" +
    formatLines(highLevelSummariesNormalizedLines) +
    "Overview (unique outcomes)\n" +
    formatLines(highlightLines) +
    "High-level summaries (unique outcomes)\n\n" +
    formatLines(highLevelSummariesLines) +
    "Detailed results\n\n" +
    detailedLines.join("\n") +
    "\n\n\n" +
    verboseLines.join("\n")
  );
}

function formatLines(lines: string[]) {
  const indentStr = indent(1);
  const newLines: string[] = [];
  for (const line of lines) {
    newLines.push(
      ...line
        .split("\n")
        .map((newLine) =>
          newLine.trim().length === 0 ? "" : indentStr + newLine
        )
    );
  }
  return newLines.join("\n") + "\n";
}

function printPatternSummaryFoxNoFox({
  highlightNormalizedLines,
  highlightLines,
  highLevelSummariesNormalizedLines,
  highLevelSummariesLines,
  detailedLines,
  key,
  patternGroup,
  patternPartitions,
}: {
  key: string;
  patternGroup: ExtendedAutoSolveStrategyResult[];
  patternPartitions?: OnlyFoxNoFox<Map<string, ExtendedAutoSolveRollups>>;

  highlightNormalizedLines?: string[];
  highlightLines?: string[];
  highLevelSummariesNormalizedLines?: string[];
  highLevelSummariesLines?: string[];
  detailedLines?: string[];
}) {
  const { onlyFox, noFox } = rollupFoxNoFox(patternGroup);

  if (
    highlightNormalizedLines !== undefined &&
    patternPartitions !== undefined
  ) {
    printHighlightsNormalized(highlightNormalizedLines, key, patternPartitions);
  }

  if (highlightLines !== undefined) {
    printHighlights(highlightLines, key, onlyFox, noFox);
  }

  if (
    highLevelSummariesNormalizedLines !== undefined &&
    patternPartitions !== undefined
  ) {
    printStrategyPercentsNormalized(
      highLevelSummariesNormalizedLines,
      `Rollup of ${key} - Fox`,
      onlyFox,
      patternPartitions.onlyFox
    );
    printStrategyPercentsNormalized(
      highLevelSummariesNormalizedLines,
      `Rollup of ${key} - No Fox`,
      noFox,
      patternPartitions.noFox
    );
  }

  if (highLevelSummariesLines !== undefined) {
    printStrategyPercents(highLevelSummariesLines, `${key} - Fox`, onlyFox);
    printStrategyPercents(highLevelSummariesLines, `${key} - No Fox`, noFox);
  }

  if (detailedLines !== undefined) {
    detailedLines.push(`${indent(1)}${key} - Fox`);
    printPatternSummary(
      detailedLines,
      printCalculation(onlyFox.minInSlot, onlyFox.maxInSlot)
    );
    detailedLines.push(`${indent(1)}${key} - No Fox`);
    printPatternSummary(
      detailedLines,
      printCalculation(noFox.minInSlot, noFox.maxInSlot)
    );
  }
}

function cmpArrays<T>(a: readonly T[], b: readonly T[]) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
