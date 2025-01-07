import { execSync } from "child_process";
import { map } from "../consts.js";
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

for (const [solver, weighters] of map) {
  for (const weighter of weighters) {
    const command = `npm run script:full-solve --- --solver=${solver} --weighter=${weighter} --skipExistingSolves=${options.skipExistingSolves}`;
    console.log(`> ${command}`);
    execSync(command, { stdio: "inherit" });
  }
}
