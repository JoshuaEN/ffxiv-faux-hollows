import { AutoSolveExpandedResultStepsTo } from "../generate-summaries.js";
import {
  formatter,
  formatter1Place,
  getMedian,
  getStandardDeviation,
} from "./helpers.js";
import { assert } from "~/src/helpers.js";
import EasyTable from "easy-table";

export interface AutoSolveResultSummaryData {
  min: number;
  max: number;
  avg: number;
  median: number;
  stdev: number;
  count: number;
  total: number;
}
export type AutoSolveResultSummary = Record<
  keyof AutoSolveExpandedResultStepsTo,
  AutoSolveResultSummaryData
>;

const blankLeftPadder = EasyTable.leftPadder(" ");

export function printExpandedResultSummary(
  lines: string[],
  headerPrefix: string,
  results: AutoSolveExpandedResultStepsTo[]
) {
  const summaries = calculateSummary(results);
  const valueColumnWidth = 10;
  const table = new EasyTable();
  function printSummary(
    title: string,
    lookup: keyof AutoSolveExpandedResultStepsTo
  ) {
    table.cell("", title, blankLeftPadder);
    table.cell(
      "Avg".padEnd(valueColumnWidth, " "),
      formatter.format(summaries[lookup].avg),
      blankLeftPadder
    );
    table.cell(
      "min".padEnd(valueColumnWidth, " "),
      summaries[lookup].min,
      blankLeftPadder
    );
    table.cell(
      "max".padEnd(valueColumnWidth, " "),
      summaries[lookup].max,
      blankLeftPadder
    );
    table.cell(
      "Median".padEnd(valueColumnWidth, " "),
      formatter1Place.format(summaries[lookup].median),
      blankLeftPadder
    );
    table.cell(
      "Stdev".padEnd(valueColumnWidth, " "),
      formatter.format(summaries[lookup].stdev),
      blankLeftPadder
    );
    table.cell(
      "Count".padEnd(valueColumnWidth, " "),
      summaries[lookup].count,
      blankLeftPadder
    );
    table.newRow();
  }

  lines.push(headerPrefix);

  table.cell("", headerPrefix + "Steps to Find");
  table.newRow();

  printSummary("Sword", "FoundSword");
  printSummary("Present", "FoundPresent");
  printSummary("Sword & Present", "FoundSwordPresent");

  printSummary("Fox last", "FoundFox");
  printSummary("Fox first", "UncoverFox");
  printSummary("Four or less Fox Spots", "possibleFoxIndexes4");
  printSummary("Three or less Fox Spots", "possibleFoxIndexes3");
  printSummary("Two or less Fox Spots", "possibleFoxIndexes2");
  printSummary("One or less Fox Spots", "possibleFoxIndexes1");
  printSummary("Zero Fox Spots", "possibleFoxIndexes0");

  printSummary("All", "totalSteps");

  table.newRow();
  table.cell("", headerPrefix + "Steps to Uncover");
  table.newRow();

  printSummary("Sword", "UncoverSword");
  printSummary("Present", "UncoverPresent");

  printSummary("Sword & Present", "UncoverSwordPresent");

  printSummary("Sword & Fox", "UncoverSwordFox");
  printSummary("Present & Fox", "UncoverPresentFox");

  printSummary("All", "UncoverAll");

  lines.push(table.toString());
}

function calculateSummary(
  results: AutoSolveExpandedResultStepsTo[]
): AutoSolveResultSummary {
  const intermediateResults = new Map<
    keyof AutoSolveExpandedResultStepsTo,
    { min: number; max: number; values: number[]; total: number; count: number }
  >();

  for (const result of results) {
    for (const [key, value] of Object.entries(result) as [
      keyof AutoSolveExpandedResultStepsTo,
      number,
    ][]) {
      const intermediateResult = intermediateResults.get(key) ?? {
        min: Number.MAX_SAFE_INTEGER,
        max: -1,
        values: [],
        total: 0,
        count: 0,
      };
      intermediateResult.total += value;
      intermediateResult.count += 1;
      intermediateResult.min = Math.min(intermediateResult.min, value);
      intermediateResult.max = Math.max(intermediateResult.max, value);
      intermediateResult.values.push(value);
      intermediateResults.set(key, intermediateResult);
    }
  }

  const finalResults: Partial<AutoSolveResultSummary> = {};

  for (const [key, data] of intermediateResults) {
    finalResults[key] = {
      avg: data.total / data.count,
      min: data.min,
      max: data.max,
      median: getMedian(data.values),
      stdev: getStandardDeviation(data.values),
      count: data.count,
      total: data.total,
    };
  }

  assertAllAutoSolveResultsFilled(finalResults);

  return finalResults;
}

function assertAllAutoSolveResultsFilled(
  results: Partial<AutoSolveResultSummary>
): asserts results is AutoSolveResultSummary {
  assert(results.FoundFox !== undefined);
  assert(results.FoundPresent !== undefined);
  assert(results.FoundSword !== undefined);
  assert(results.FoundSwordPresent !== undefined);
  assert(results.UncoverFox !== undefined);
  assert(results.UncoverPresentFox !== undefined);
  assert(results.UncoverSwordFox !== undefined);
  assert(results.UncoverAll !== undefined);
  assert(results.UncoverPresent !== undefined);
  assert(results.UncoverSword !== undefined);
  assert(results.UncoverSwordPresent !== undefined);
  assert(results.UncoverBestAll !== undefined);
  assert(results.possibleFoxIndexes0 !== undefined);
  assert(results.possibleFoxIndexes1 !== undefined);
  assert(results.possibleFoxIndexes2 !== undefined);
  assert(results.possibleFoxIndexes3 !== undefined);
  assert(results.possibleFoxIndexes4 !== undefined);
  assert(results.presentFullSteps !== undefined);
  assert(results.swordFullSteps !== undefined);
  assert(results.totalSteps !== undefined);
}
