import { makeRunner, SequenceRunnerFactory } from "./framework.js";
import { data as blockedSmartFillData } from "./data/blocked-smart-fill.data.js";
import { data as foxSuggestionsData } from "./data/fox-suggestions.data.js";
import { data as presentsSmartFillData } from "./data/presents-smart-fill.data.js";
import { data as smartFillEdgeCasesData } from "./data/smart-fill-edge-cases.data.js";
import { data as swordSmartFillData } from "./data/sword-smart-fill.data.js";

export function allTestData(runnerFactory: SequenceRunnerFactory) {
  const runner = makeRunner(runnerFactory);

  blockedSmartFillData(runner);
  foxSuggestionsData(runner);
  presentsSmartFillData(runner);
  smartFillEdgeCasesData(runner);
  swordSmartFillData(runner);
}

// export async function allTestData(runnerFactory: SequenceRunnerFactory) {
//   const runner = makeRunner(runnerFactory);

//   for (const file of fs.readdirSync(basePath)) {
//     const fullPath = path.join(basePath, file);
//     if (!file.endsWith(".data.ts")) {
//       if (file.endsWith(".ts")) {
//         throw new Error(
//           `${fullPath} does not end with .data.ts but is a .ts file in the data folder`
//         );
//       }
//       continue;
//     }
//     // Node caches imports
//     const fileHash = createHash("sha256")
//       .update(fs.readFileSync(fullPath))
//       .digest("base64url");
//     const testData = (await import(`${fullPath}?hash=${fileHash}`)) as unknown;
//     if (
//       typeof testData === "object" &&
//       testData !== null &&
//       "data" in testData
//     ) {
//       const data = testData.data;
//       if (typeof data === "function") {
//         await data(runner);
//       } else {
//         throw new Error(`data export from ${fullPath} was not a function`);
//       }
//     } else {
//       throw new Error(`data export from ${fullPath} was missing`);
//     }
//   }
// }
