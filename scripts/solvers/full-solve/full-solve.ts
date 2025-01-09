import fs from "node:fs";
import { join } from "path";
import { getProjectRoot } from "~/scripts/helpers.js";
import {
  communityDataByIdentifier,
  CommunityDataIdentifiers,
} from "~/src/game/generated-community-data.js";
import { autoSolve } from "~/test/auto-solver/full/auto-solver.js";
import { printAutoSolverResults } from "~/test/auto-solver/full/print-auto-solver-results.js";
import { BoardHarness } from "~/test/board/board.harness.js";

const repoRoot = getProjectRoot();

const solveFileName = `${import.meta.env["SOLVER"]}`;
const existingFileMode =
  import.meta.env["SKIP_EXISTING_SOLVES"] === true
    ? "keep"
    : ("overwrite" as const);
console.log(solveFileName);
console.log(`  Existing solves: ${existingFileMode}`);
const docsRoot = join(repoRoot, "docs", "solve-methods", "result-logs");
const intermediaryResultsDir = join(
  repoRoot,
  "solve-results",
  "auto-solver",
  solveFileName
);
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(intermediaryResultsDir, { recursive: true });

for (const identifier of Object.keys(
  communityDataByIdentifier
) as CommunityDataIdentifiers[]) {
  console.log(`  Solve ${identifier}`);
  await autoSolve(new BoardHarness(), {
    identifier,
    outDir: intermediaryResultsDir,
    existingFileMode,
  });
}

const outputTextFile = join(docsRoot, `${solveFileName}.txt`);
console.log(`Generate results for all solves`);
const result = printAutoSolverResults(intermediaryResultsDir);
fs.writeFileSync(
  outputTextFile,
  `Solver: ${import.meta.env["SOLVER"]}\n${result}`
);

console.log("Done");
