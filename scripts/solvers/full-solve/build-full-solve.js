// @ts-check
import * as esbuild from "esbuild";
import path from "path";
import process from "process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { solvers } from "../consts.js";

const options = yargs(hideBin(process.argv))
  .option("solver", {
    alias: "s",
    choices: solvers,
    demandOption: true,
  })
  .option("skip-existing-solves", {
    type: "boolean",
    demandOption: true,
    description: "Skip solving patterns if the output file already exists",
  })
  .strict()
  .version(false)
  .parseSync();

const repoRoot = path.resolve(path.join(import.meta.dirname, "..", "..", ".."));

await esbuild.build({
  entryPoints: [
    path.join(repoRoot, "scripts", "solvers", "full-solve", "full-solve.ts"),
  ],
  define: {
    "import.meta.env.DEV": `true`,
    "import.meta.env.SOLVER": `${JSON.stringify(options.solver)}`,
    "import.meta.env.LOGGING": "false",
    "import.meta.env.SKIP_EXISTING_SOLVES": `${options.skipExistingSolves ?? false}`,
  },
  platform: "node",
  sourcemap: true,
  format: "esm",
  bundle: true,
  outfile: path.join(
    repoRoot,
    "dist",
    "solvers",
    "full-solve",
    "full-solve.js"
  ),
});
