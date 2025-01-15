import { solveAllPatterns } from "~/test/auto-solver/short-circuit/auto-solver.js";
import { stringifyAutoSolveResults } from "~/test/auto-solver/short-circuit/formatter.js";
import { getProjectRoot } from "~/scripts/helpers.js";
import fs from "node:fs";
import { join } from "path";

const repoRoot = getProjectRoot();

const docsRoot = join(
  repoRoot,
  "docs",
  "solve-methods",
  "short-circuit-result-logs"
);
fs.mkdirSync(docsRoot, { recursive: true });

const solveFileName = `${import.meta.env["SOLVER"]}`;

const actual = solveAllPatterns();
const outputTextFile = join(docsRoot, `${solveFileName}.txt`);

const { text } = stringifyAutoSolveResults(actual, {
  enableText: true,
});
fs.writeFileSync(
  outputTextFile,
  `Solver: ${import.meta.env["SOLVER"]}\n` + text
);
console.log("Done");
