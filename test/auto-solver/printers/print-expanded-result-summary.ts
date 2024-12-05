import { TileState } from "~/src/game/types/tile-states.js";
import { AutoSolveExpandedResult } from "../generate-summaries.js";
import { formatter, formatter1Place } from "./helpers.js";
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
  keyof AutoSolveExpandedResult["stepsTo"],
  AutoSolveResultSummaryData
>;

const blankLeftPadder = EasyTable.leftPadder(" ");

export function printExpandedResultSummary(
  lines: string[],
  headerPrefix: string,
  results: AutoSolveExpandedResult[]
) {
  const summaries = calculateSummary(results);
  const valueColumnWidth = 10;
  const table = new EasyTable();
  function printSummary(
    title: string,
    lookup: keyof AutoSolveExpandedResult["stepsTo"]
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

  table.newRow();
  table.cell("", headerPrefix + "Steps to Uncover");
  table.newRow();

  printSummary("Sword", "fullSword");
  printSummary("Present", "fullPresent");

  printSummary("Sword & Present", "fullSwordPresent");

  printSummary("Sword & Fox", "bestSwordFox");
  printSummary("Present & Fox", "bestPresentFox");

  printSummary("All", "fullTotal");

  lines.push(table.toString());
}

function calculateSummary(
  results: AutoSolveExpandedResult[]
): AutoSolveResultSummary {
  const intermediateResults = new Map<
    keyof AutoSolveExpandedResult["stepsTo"],
    { min: number; max: number; values: number[]; total: number; count: number }
  >();

  for (const result of results) {
    for (const [key, value] of Object.entries(result.stepsTo) as [
      keyof AutoSolveExpandedResult["stepsTo"],
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
    data.values.sort();
    let median = -1;
    const halfWayIndex = Math.floor(data.values.length / 2);
    const halfWayValue = data.values[halfWayIndex];
    assert(halfWayValue !== undefined);
    if (data.values.length % 2 === 0) {
      const halfWayMinus1Value = data.values[halfWayIndex - 1];
      assert(halfWayMinus1Value !== undefined);
      median = (halfWayMinus1Value + halfWayValue) / 2;
    } else {
      median = halfWayValue;
    }
    finalResults[key] = {
      avg: data.total / data.count,
      min: data.min,
      max: data.max,
      median,
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
  assert(results.Fox !== undefined);
  assert(results.Present !== undefined);
  assert(results.Sword !== undefined);
  assert(results.SwordPresent !== undefined);
  assert(results.bestFox !== undefined);
  assert(results.bestPresentFox !== undefined);
  assert(results.bestSwordFox !== undefined);
  assert(results.bestTotal !== undefined);
  assert(results.fullPresent !== undefined);
  assert(results.fullSword !== undefined);
  assert(results.fullSwordPresent !== undefined);
  assert(results.fullTotal !== undefined);
  assert(results.possibleFoxIndexes0 !== undefined);
  assert(results.possibleFoxIndexes1 !== undefined);
  assert(results.possibleFoxIndexes2 !== undefined);
  assert(results.possibleFoxIndexes3 !== undefined);
  assert(results.possibleFoxIndexes4 !== undefined);
  assert(results.presentFullSteps !== undefined);
  assert(results.swordFullSteps !== undefined);
  assert(results.totalSteps !== undefined);
}

function getStandardDeviation(array: number[]) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
}
