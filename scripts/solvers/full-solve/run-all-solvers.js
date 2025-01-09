import { execSync } from "child_process";
import { solvers } from "../consts.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const options = yargs(hideBin(process.argv))
  .option("skip-existing-solves", {
    type: "boolean",
    demandOption: true,
    description: "Skip solving patterns if the output file already exists",
  })
  .strict()
  .version(false)
  .parseSync();

for (const solver of solvers) {
  const command = `npm run script:full-solve --- --solver=${solver} --skipExistingSolves=${options.skipExistingSolves}`;
  console.log(`> ${command}`);
  execSync(command, { stdio: "inherit" });
}
