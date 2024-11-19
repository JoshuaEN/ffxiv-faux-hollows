import { solveAllPatterns } from "~/test/auto-solver/auto-solver.js";
import { stringifyAutoSolveResults } from "~/test/auto-solver/formatter.js";

import fs from "node:fs";
import { join } from "path";

const enableCsv = import.meta.env["ENABLE_CSV"] === true;

// Note: We're actually inside ./dist/full-solve
const repoRoot = join(import.meta.dirname, "..", "..");

const docsRoot = join(repoRoot, "docs", "solve-methods", "result-logs");
fs.mkdirSync(docsRoot, { recursive: true });

const solveFileName = `${import.meta.env["SOLVER"]}.${import.meta.env["WEIGHTER"]}`;

const actual = solveAllPatterns();
const outputTextFile = join(docsRoot, `${solveFileName}.txt`);
const outputCsvFile = join(docsRoot, `${solveFileName}.csv`);
// const expectedCsvFile = join(
//   dirname(fileURLToPath(import.meta.url)),
//   "actual-solve-data.csv"
// );

// const expCsv = fs.existsSync(expectedCsvFile)
//   ? fs.readFileSync(expectedCsvFile, { encoding: "utf8" })
//   : "";

const { text, csv } = stringifyAutoSolveResults(actual, {
  enableText: true,
  enableCsv,
});
fs.writeFileSync(
  outputTextFile,
  `Solver: ${import.meta.env["SOLVER"]} | Weighter: ${import.meta.env["WEIGHTER"]}\n` +
    text
);
if (enableCsv) {
  fs.writeFileSync(outputCsvFile, csv);
}

// const actualSorted = new Set(csv.split("\n").slice(1));
// const actualFound = new Set();
// const expectedSorted = expCsv.split("\n").slice(1);
// for (const exp of expectedSorted) {
//   if (actualFound.has(exp)) {
//     console.log(`Found duplicate of ${exp} in actual`);
//     break;
//   } else if (actualSorted.has(exp)) {
//     actualFound.add(exp);
//   } else {
//     console.log(
//       `Line:\n${exp}\nin expected data set not found in actual data set`
//     );
//     break;
//   }
// }
// if (actualFound.size !== actualSorted.size) {
//   console.log(`${actualFound.size} does not match ${actualSorted.size}`);
// } else {
console.log("Done");
// }
