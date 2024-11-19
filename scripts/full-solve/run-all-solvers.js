import { execSync } from "child_process";
import { map } from "./consts.js";

for (const [solver, weighters] of map) {
  for (const weighter of weighters) {
    const command = `npm run script:full-solve --- --solver=${solver} --weighter=${weighter}`;
    console.log(`> ${command}`);
    execSync(command, { stdio: "inherit" });
  }
}
