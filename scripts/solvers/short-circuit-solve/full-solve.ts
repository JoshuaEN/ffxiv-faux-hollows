import { solveAllPatterns } from "~/test/auto-solver/short-circuit/auto-solver.js";
import { stringifyAutoSolveResults } from "~/test/auto-solver/short-circuit/formatter.js";

import fs from "node:fs";
import { join } from "path";

const enableCsv = import.meta.env["ENABLE_CSV"] === true;

// Note: We're actually inside ./dist/full-solve
const repoRoot = join(import.meta.dirname, "..", "..");

const docsRoot = join(
  repoRoot,
  "docs",
  "solve-methods",
  "short-circuit-result-logs"
);
fs.mkdirSync(docsRoot, { recursive: true });

const solveFileName = `${import.meta.env["SOLVER"]}.${import.meta.env["WEIGHTER"]}`;

const actual = solveAllPatterns();
const outputTextFile = join(docsRoot, `${solveFileName}.txt`);
const outputCsvFile = join(docsRoot, `${solveFileName}.csv`);

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

console.log("Done");
