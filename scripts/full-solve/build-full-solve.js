// @ts-check
import * as esbuild from "esbuild";
import path from "path";
import process from "process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { solvers, weighters } from "./consts.js";

const options = yargs(hideBin(process.argv))
  .option("solver", {
    alias: "s",
    choices: solvers,
    demandOption: true,
  })
  .option("weighter", {
    alias: "w",
    choices: weighters,
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

const repoRoot = path.resolve(path.join(import.meta.dirname, "..", ".."));

await esbuild.build({
  entryPoints: [path.join(repoRoot, "scripts", "full-solve", "full-solve.ts")],
  define: {
    "import.meta.env.DEV": `true`,
    "import.meta.env.SOLVER": `${JSON.stringify(options.solver)}`,
    "import.meta.env.WEIGHTER": `${JSON.stringify(options.weighter)}`,
    "import.meta.env.ENABLE_CSV": `${JSON.stringify(options.csv)}`,
  },
  platform: "node",
  sourcemap: true,
  format: "esm",
  bundle: true,
  outfile: path.join(repoRoot, "dist", "full-solve", "full-solve.js"),
});
