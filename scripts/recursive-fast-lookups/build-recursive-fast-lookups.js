// @ts-check
import * as esbuild from "esbuild";
import path from "path";
import { getProjectRoot } from "../../scripts/helpers.js";

const repoRoot = getProjectRoot();

await esbuild.build({
  entryPoints: [
    path.join(
      repoRoot,
      "scripts",
      "recursive-fast-lookups",
      "create-recursive-fast-lookups.ts"
    ),
  ],
  define: {
    "import.meta.env.DEV": `true`,
    "import.meta.env.SOLVER": `${JSON.stringify("community-data-recursive")}`,
  },
  platform: "node",
  sourcemap: true,
  format: "esm",
  bundle: true,
  outfile: path.join(
    repoRoot,
    "dist-scripts",
    "recursive-fast-lookups",
    "create-recursive-fast-lookups.js"
  ),
});
