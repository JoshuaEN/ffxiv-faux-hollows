// import { describe, expect, test } from "vitest";
// import { solveAllPatterns } from "~/test/auto-solver/auto-solver.js";
// import expected from "./expected-solve-data.json";
// import fs from "node:fs";
// import { join, dirname } from "node:path";
// import { format } from "prettier";
// import { fileURLToPath } from "node:url";

// describe("Solve Steps Regression Tests", () => {
//   test("solves all patterns correctly", async () => {
//     const actual = solveAllPatterns();

//     fs.writeFileSync(
//       join(dirname(fileURLToPath(import.meta.url)), "actual-solve-data.json"),
//       await format(JSON.stringify(actual))
//     );
//     expect(actual).toEqual(expected);
//   });
// });
