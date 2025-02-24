// @ts-check
import * as esbuild from "esbuild";
import path from "path";
import process from "process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { solvers } from "../consts.js";
import { getProjectRoot } from "../../helpers.js";

const options = yargs(hideBin(process.argv))
  .option("solver", {
    alias: "s",
    choices: solvers,
    demandOption: true,
  })
  .option("csv", {
    type: "boolean",
    default: false,
    demandOption: false,
  })
  .strict()
  .version(false)
  .parseSync();
const repoRoot = getProjectRoot();

await esbuild.build({
  entryPoints: [
    path.join(
      repoRoot,
      "scripts",
      "solvers",
      "short-circuit-solve",
      "full-solve.ts"
    ),
  ],
  define: {
    "import.meta.env.DEV": `true`,
    "import.meta.env.SOLVER": `${JSON.stringify(options.solver)}`,
  },
  platform: "node",
  sourcemap: true,
  format: "esm",
  bundle: true,
  outfile: path.join(
    repoRoot,
    "dist-scripts",
    "solvers",
    "short-circuit-solve",
    "full-solve.js"
  ),
});
