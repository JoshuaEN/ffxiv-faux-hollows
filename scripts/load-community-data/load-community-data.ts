import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import path from "path";
import process from "process";
import fs from "fs";
import prettier from "prettier";
import { TileState } from "~/src/game/types/tile-states.js";
import {
  CommunityDataIdentifierPatterns,
  CommunityDataPattern,
} from "~/src/game/types/community-data.js";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  MAX_BLOCKED,
} from "~/src/game/constants.js";
import { cordToIndex, hash, indexToCord } from "~/src/game/helpers.js";
import { chromium } from "playwright";
import { getProjectRoot } from "../helpers.js";

const args = yargs(hideBin(process.argv))
  .option("path", { alias: "path", type: "string", demandOption: true })
  .parseSync();

if (args.path.trim().length === 0) {
  throw new Error(`--path is empty`);
}

const colors = {
  "rgb(153, 153, 153)": TileState.Blocked, // #999999
  "rgb(234, 153, 153)": TileState.Present, // #ea9999
  "rgb(164, 194, 244)": TileState.Sword, // #a4c2f4
  "rgb(159, 197, 232)": TileState.Sword, // #9fc5e8 // There are two slightly different colors for Swords
  "rgb(255, 0, 255)": "ConfirmedFox", // #ff00ff
  "rgb(255, 255, 255)": "Empty", // #ffffff
  "rgb(217, 217, 217)": null, // #d9d9d9
} as const;
type ColorState = (typeof colors)[keyof typeof colors];

type Writable<T> = T extends object
  ? { -readonly [K in keyof T]: Writable<T[K]> }
  : T;

interface ExtendedCommunityDataPattern extends Writable<CommunityDataPattern> {
  Blocked: number[];
}

const blockPatterns: Record<string, Set<string> | undefined> = {};
const setsByIdentifier: Record<string, CommunityDataIdentifierPatterns> = {};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const htmlFile of fs
  .readdirSync(args.path)
  .filter((file) => file.endsWith(".html"))
  .map((file) => path.join(args.path, file))) {
  if (
    htmlFile.endsWith("Board Patterns.html") ||
    htmlFile.endsWith("How to Use.html") ||
    htmlFile.endsWith("Edits.html")
  ) {
    continue;
  }
  const html = fs.readFileSync(htmlFile, { encoding: "utf8" });
  await page.setContent(html);

  const { identifier, parsed } = await page.evaluate(
    ([colorsLookup, htmlFile]) => {
      const tbody = window.document.querySelector("table tbody");
      if (tbody === null) {
        throw new Error(`No table tbody found in ${htmlFile}`);
      }
      const parsed: ColorState[][] = [];

      let identifier = "";
      let htmlRowIndex = 0;

      for (const tr of Array.from<Element>(tbody.children)) {
        htmlRowIndex++;
        if (htmlRowIndex === 1) {
          identifier = `${tr.children[1]?.innerHTML}${tr.children[2]?.innerHTML}`;
          continue;
        }
        const parsedRow: ColorState[] = [];
        let htmlColumnIndex = 0;
        for (const td of Array.from<Element>(tr.children)) {
          htmlColumnIndex++;
          if (htmlColumnIndex === 1) {
            continue;
          }

          const cellState =
            colorsLookup[
              window.getComputedStyle(td)
                .backgroundColor as keyof typeof colorsLookup
            ] ?? null;
          parsedRow.push(cellState);
        }

        parsed.push(parsedRow);
      }
      return { identifier, parsed };
    },
    [colors, htmlFile] as const
  );

  const extendedPatterns: ExtendedCommunityDataPattern[] = [];
  for (let rowIndex = 0; rowIndex < parsed.length; rowIndex++) {
    const row = parsed[rowIndex];
    // If the 2nd column has nothing, this row is not interesting
    if (row?.[1] === null || row?.[1] === undefined) {
      continue;
    }

    for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
      const column = row[columnIndex];

      if (column === undefined || column === null) {
        continue;
      }

      const set: Partial<ExtendedCommunityDataPattern> & {
        Blocked: number[];
        ConfirmedFoxes: number[];
      } = {
        Blocked: [],
        Present: undefined,
        Sword: undefined,
        Sword3x2: undefined,
        ConfirmedFoxes: [],
      };

      const errorPrefix = `Invalid state in file ${htmlFile} (${identifier}) for table at ${rowIndex},${columnIndex}\n`;
      const errorIdxToCord = (index: number) => {
        const { x, y } = indexToCord(index);
        return `${x},${y} (index ${index})`;
      };

      const validBoxIndexes = new Set<number>();
      const validSwordIndexes = new Set<number>();

      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          const index = cordToIndex(x, y);
          const cellState = parsed[rowIndex + y]?.[columnIndex + x];
          switch (cellState) {
            case TileState.Present: {
              // We are processing from left to right, top to bottom
              // We only record the top-left most box cell because the remaining places can be inferred.
              if (set.Present === undefined) {
                set.Present = index;

                // We verify the box is as we expect by adding all (other) expected indexes
                // and then remove them as we encounter them.
                validBoxIndexes.add(cordToIndex(x + 1, y));
                validBoxIndexes.add(cordToIndex(x, y + 1));
                validBoxIndexes.add(cordToIndex(x + 1, y + 1));
              } else {
                if (!validBoxIndexes.delete(index)) {
                  throw new Error(
                    `${errorPrefix} Box pattern at ${x},${y} is not valid; ${errorIdxToCord(
                      index
                    )} has a box, which is not expected based on the location of the top-left box at ${errorIdxToCord(
                      set.Present
                    )}`
                  );
                }
              }
              break;
            }
            case TileState.Sword: {
              // We are processing from left to right, top to bottom
              // We only record the top-left most box cell because the remaining places can be inferred (along with the width for orientation).
              if (set.Sword === undefined) {
                set.Sword = index;
                // We look two indexes ahead; if the 3x2 orientation is present, this will still be a sword
                // If the 2x3 orientation is present, this will be some other cell (or even off the edge of the panel, but there is a spacer between them so this is fine)
                set.Sword3x2 =
                  parsed[y + rowIndex]?.[x + columnIndex + 2] ===
                  TileState.Sword;

                // We verify the box is as we expect by adding all (other) expected indexes
                // and then remove them as we encounter them.
                validSwordIndexes.add(cordToIndex(x + 1, y));
                validSwordIndexes.add(cordToIndex(x, y + 1));
                validSwordIndexes.add(cordToIndex(x + 1, y + 1));
                if (set.Sword3x2) {
                  validSwordIndexes.add(cordToIndex(x + 2, y));
                  validSwordIndexes.add(cordToIndex(x + 2, y + 1));
                } else {
                  validSwordIndexes.add(cordToIndex(x, y + 2));
                  validSwordIndexes.add(cordToIndex(x + 1, y + 2));
                }
              } else {
                if (!validSwordIndexes.delete(index)) {
                  throw new Error(
                    `${errorPrefix} Sword pattern at ${x},${y} is not valid; ${errorIdxToCord(
                      index
                    )} has a sword, which is not expected based on the location of the top-left sword at ${errorIdxToCord(
                      set.Sword
                    )} (sword is ${set.Sword3x2 === true ? "3x2" : "2x3"})`
                  );
                }
              }
              break;
            }
            case TileState.Blocked: {
              set.Blocked.push(index);
              break;
            }
            case "ConfirmedFox": {
              set.ConfirmedFoxes.push(index);
              break;
            }
            case "Empty": {
              // Do nothing
              break;
            }
            default: {
              throw new Error(
                `${errorPrefix} Cell has unknown or unsupported value of: ${cellState}`
              );
            }
          }
        }
      }

      if (
        set.Present === undefined ||
        set.Sword === undefined ||
        set.Sword3x2 === undefined
      ) {
        throw new Error(`${errorPrefix} Missing Sword or Box`);
      }

      if (set.Blocked.length !== MAX_BLOCKED) {
        throw new Error(
          `${errorPrefix} Blocked cells is ${set.Blocked.length} (should be ${MAX_BLOCKED})`
        );
      }

      if (validBoxIndexes.size > 0) {
        throw new Error(
          `${errorPrefix} Box pattern at is not valid; not all indexes on the box were visited, which is not expected based on the location of the top-left box at ${errorIdxToCord(
            set.Present
          )}: Remaining indexes: ${Array.from(validBoxIndexes.keys())
            .map(errorIdxToCord)
            .join(",")}`
        );
      }
      if (validSwordIndexes.size > 0) {
        throw new Error(
          `${errorPrefix} Sword pattern at is not valid; not all indexes on the sword were visited, which is not expected based on the location of the top-left sword at ${errorIdxToCord(
            set.Sword
          )} (sword is ${
            set.Sword3x2 ? "3x2" : "2x3"
          }): Remaining indexes: ${Array.from(validBoxIndexes.keys())
            .map(errorIdxToCord)
            .join(",")}`
        );
      }

      extendedPatterns.push(set as ExtendedCommunityDataPattern);

      // Skip the columns we just processed to get to the next entry in this row
      columnIndex += BOARD_WIDTH;
    }

    // Skip everything we just processed
    rowIndex += BOARD_HEIGHT;
  }

  const samplePattern = extendedPatterns[0];
  if (samplePattern === undefined) {
    throw new Error(`${htmlFile} No patterns found`);
  }
  const samplePatternHash = hash(samplePattern.Blocked);
  (blockPatterns[samplePatternHash] ??= new Set<string>()).add(identifier);

  // We generate a list
  for (let i = 0; i < samplePattern.Blocked.length; i++) {
    const blockedI = samplePattern.Blocked[i];
    if (blockedI === undefined) {
      throw new Error("Typescript");
    }
    const iLoopHash = hash([blockedI]);
    (blockPatterns[iLoopHash] ??= new Set<string>()).add(identifier);
    for (let j = i + 1; j < samplePattern.Blocked.length; j++) {
      const blockedJ = samplePattern.Blocked[j];
      if (blockedJ === undefined) {
        throw new Error("Typescript");
      }
      const jLoopHash = hash([blockedI, blockedJ]);
      (blockPatterns[jLoopHash] ??= new Set<string>()).add(identifier);
      for (let k = j + 1; k < samplePattern.Blocked.length; k++) {
        const blockedK = samplePattern.Blocked[k];
        if (blockedK === undefined) {
          throw new Error("Typescript");
        }
        const kLoopHash = hash([blockedI, blockedJ, blockedK]);
        const blockPatternLoopHashK = (blockPatterns[kLoopHash] ??=
          new Set<string>());
        blockPatternLoopHashK.add(identifier);
        if (blockPatternLoopHashK.size > 1) {
          throw new Error(
            `Invalid state in file ${htmlFile} (${identifier}): 3 indexes was not enough to achieve uniqueness for ${kLoopHash}`
          );
        }
      }
    }
  }

  const patterns: CommunityDataPattern[] = [];
  for (const pattern of extendedPatterns) {
    const patternHash = hash(pattern.Blocked);
    if (patternHash !== samplePatternHash) {
      throw new Error(
        `Invalid state in file ${htmlFile} (${identifier}): Hash comparison failed for ${identifier}: ${samplePatternHash} !== ${patternHash}`
      );
    }
    patterns.push({
      Present: pattern.Present,
      Sword: pattern.Sword,
      Sword3x2: pattern.Sword3x2,
      ConfirmedFoxes: pattern.ConfirmedFoxes,
    });
  }

  if (identifier in setsByIdentifier) {
    throw new Error(`Identifier already exists: ${identifier}`);
  }
  setsByIdentifier[identifier] = {
    Blocked: samplePattern.Blocked,
    Patterns: patterns,
  };
}

await browser.close();

fs.writeFileSync(
  path.join(getProjectRoot(), "src", "game", "generated-community-data.ts"),
  await prettier.format(
    `
// AUTO GENERATED FILE
// DO NOT EDIT DIRECTLY
// Generated by './scripts/load-community-data/load-community-data.ts'
import { CommunityDataIdentifierPatterns } from './types'
export type CommunityDataIdentifiers = (keyof typeof _communityDataByIdentifier);
export const communityDataBlocksToIdentifier: Record<string, readonly CommunityDataIdentifiers[] | undefined> = ${JSON.stringify(
      Array.from(Object.entries(blockPatterns))
        .sort((a, b) => a[0].length - b[0].length)
        .reduce<Record<string, string[]>>((acc, [k, v]) => {
          acc[k] = Array.from(v?.keys() ?? []);
          return acc;
        }, {})
    )} as const;
const _communityDataByIdentifier = ${JSON.stringify(setsByIdentifier)} as const;
export const communityDataByIdentifier: Record<CommunityDataIdentifiers, CommunityDataIdentifierPatterns> = _communityDataByIdentifier;
`,
    { parser: "typescript" }
  )
);
