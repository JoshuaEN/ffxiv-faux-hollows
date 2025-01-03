import fs from "node:fs";
import { join } from "path";
import { chromium } from "playwright";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getProjectRoot } from "~/scripts/helpers.js";
import { CommunityDataIdentifiers } from "~/src/game/generated-community-data.js";
import { assertDefined } from "~/src/helpers.js";
import { autoSolve } from "~/test/auto-solver/full/auto-solver.js";
import { printAutoSolverResults } from "~/test/auto-solver/full/print-auto-solver-results.js";
import { GameBoardHarness } from "~/test/playwright/game-board.harness.js";

const identifierMap: Record<string, CommunityDataIdentifiers> = {
  Au: "A",
  Al: "A←",
  Ar: "A→",
  Ad: "A↓",

  Bu: "B",
  Bl: "B←",
  Br: "B→",
  Bd: "B↓",

  Cu: "C",
  Cl: "C←",
  Cr: "C→",
  Cd: "C↓",

  Du: "D",
  Dl: "D←",
  Dr: "D→",
  Dd: "D↓",
};

const options = yargs(hideBin(process.argv))
  .option("identifier", {
    type: "string",
    describe: "[ABCD][udlr]",
    coerce: (arg: string) => {
      return identifierMap[arg];
    },
  })
  .option("group-name", {
    type: "string",
    demandOption: true,
  })
  .option("operation", {
    type: "string",
    choices: ["run", "generate-summaries"] as const,
    demandOption: true,
  })
  .option("skip-existing-solves", {
    type: "boolean",
    demandOption: false,
    default: false,
    description: "Skip solving patterns if the output file already exists",
  })
  .strict()
  .version(false)
  .parseSync();

const repoRoot = getProjectRoot();

const docsRoot = join(repoRoot, `docs`, "solve-methods", "result-logs-e2e");
const intermediaryResultsDir = join(
  repoRoot,
  "solve-results",
  "auto-solver-e2e",
  options.groupName
);
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(intermediaryResultsDir, { recursive: true });

if (options.operation === "run") {
  assertDefined(options.identifier);

  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext({
      baseURL: "http://localhost:5173/",
    });
    const page = await context.newPage();
    await page.goto(".");

    await autoSolve(
      new GameBoardHarness(
        page.locator("html"),
        {
          page,
          request: context.request,
          context,
        },
        step
      ),
      {
        identifier: options.identifier,
        outDir: intermediaryResultsDir,
        existingFileMode:
          options.skipExistingSolves === true ? "keep" : "error",
      }
    );
    await context.close();
  } finally {
    await browser.close();
  }
} else {
  const outputTextFile = join(docsRoot, `result-${options.groupName}.txt`);
  const result = printAutoSolverResults(intermediaryResultsDir);
  fs.writeFileSync(outputTextFile, `Solver\n${result}`);
}

console.log("Done");

async function step<T>(title: string, body: () => T | Promise<T>): Promise<T> {
  const result = await body();
  return result;
}
