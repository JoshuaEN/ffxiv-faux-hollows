import { execSync } from "child_process";
import { solvers } from "../consts.js";

for (const solver of solvers) {
  const command = `npm run script:short-circuit:full-solve --- --solver=${solver}`;
  console.log(`> ${command}`);
  execSync(command, { stdio: "inherit" });
}
