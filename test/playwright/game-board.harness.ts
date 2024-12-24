import test, {
  expect,
  Locator,
  Page,
  PlaywrightTestArgs,
} from "@playwright/test";
import {
  BoardIssue,
  SmartFillTileState,
  SuggestTileState,
  TileState,
} from "~/src/game/types/index.js";
import {
  BaseSequenceRunner,
  FormatDataSource,
  TestGameStateSnapshot,
} from "../framework.js";
import {
  CellTestData,
  loadAsciiGrid,
  TestPatternData,
} from "../helpers/ascii-grid.js";
import { assertUnreachable } from "~/src/helpers.js";
import { includeClass } from "./expect.js";

export class GameBoardHarness extends BaseSequenceRunner {
  readonly #rootLocator: Locator;
  readonly #page: Page;
  constructor(rootLocator: Locator, args: PlaywrightTestArgs) {
    super(
      (message: string) => {
        throw new Error(message);
      },
      (actual: unknown, msg?: string) => ({
        toEqual(expected) {
          expect(actual, msg).toBe(expected);
        },
      })
    );
    this.#rootLocator = rootLocator;
    this.#page = args.page;
  }

  async getPatternData(): Promise<TestPatternData> {
    const patternCountText =
      (await this.getRemainingPatterns().count()) > 0
        ? await this.getRemainingPatterns().textContent()
        : null;
    const remainingPatterns =
      patternCountText === null ? null : parseInt(patternCountText, 10);
    return {
      patternIdentifier:
        (await this.getPattern().count()) > 0
          ? await this.getPattern().textContent()
          : null,
      remainingPatterns,
    };
  }

  protected override formatPatterns(
    source: FormatDataSource,
    patternData: TestPatternData
  ): string {
    return super.formatPatterns(source, {
      patternIdentifier:
        patternData.patternIdentifier?.length === 1
          ? `${patternData.patternIdentifier}↑`
          : patternData.patternIdentifier,
      remainingPatterns: patternData.remainingPatterns,
    });
  }

  getTile(index: number) {
    const locator = this.#rootLocator.getByTestId(`game-tile-index-${index}`);
    const tileData = {
      locator,
      combinedTileState: async () => {
        const items =
          (await locator.getAttribute("data-test-tile"))?.split(",") ?? [];
        expect(items.length).toBeGreaterThan(0);
        if (
          (await locator.getAttribute("data-test-tile-is-array")) === `true`
        ) {
          return items;
        } else {
          return items[0];
        }
      },
      tileState: async (): Promise<
        TileState | SmartFillTileState | SuggestTileState
      > => {
        const combined = await tileData.combinedTileState();
        if (
          (Array.isArray(combined) === false &&
            this.#stringIsTileState(TileState, combined)) ||
          this.#stringIsTileState(SmartFillTileState, combined) ||
          this.#stringIsTileState(SuggestTileState, combined)
        ) {
          return combined;
        } else {
          return TileState.Unknown;
        }
      },
    };
    return tileData;
  }

  async getTileState(index: number) {
    return await this.getTile(index).tileState();
  }

  getTileLocator(index: number) {
    return this.getTile(index).locator;
  }

  getPopover() {
    return this.#rootLocator.getByTestId("popover-picker");
  }

  getAllPopoverButtons() {
    return this.getPopover().locator("button:not(:disabled)");
  }

  getActiveHelpEntries() {
    return this.#rootLocator.locator(".active-help");
  }

  getActiveHelpTitles() {
    return this.getActiveHelpEntries().locator("summary");
  }

  getSolveStateHelp() {
    return this.#rootLocator.getByTestId("solve-step-help-tldr");
  }

  override async setUserSelection(
    index: number,
    tileState: TileState,
    expectInvalidMove: boolean = false
  ) {
    await test.step(`setUserSelection(${index}, TileState.${tileState}, ${expectInvalidMove})`, async () => {
      const tile = this.getTile(index);
      const existingTileState = await tile.tileState();
      const alreadyCorrectState = existingTileState === tileState;
      const isSmartFilled = this.#stringIsTileState(
        SmartFillTileState,
        existingTileState
      );

      await tile.locator.click();

      const popover = this.getPopover();
      await expect(popover).toBeVisible();
      const buttons = this.getAllPopoverButtons();

      const button = popover.getByTestId(`popover-picker-button-${tileState}`);

      if (isSmartFilled) {
        const existingNonSmartFilledTileState =
          this.#smartFillToTile(existingTileState);
        expect(
          existingNonSmartFilledTileState,
          `Wanted to set tile ${index} to ${tileState}, but it was already smart filled as ${existingTileState}`
        ).toEqual(tileState);
        await expect(button).not.toBeVisible();
        await expect(buttons.nth(0)).not.toBeVisible();
        await expect(popover).toContainText(
          `This tile must be a ${existingNonSmartFilledTileState} tile based on the other tiles on the board.`
        );
        await tile.locator.click();
        await expect(popover).not.toBeVisible();
        expect(await tile.tileState()).toEqual(existingTileState);
      } else {
        await expect(buttons.nth(0)).toBeVisible();
        await expect(button).toBeVisible();
        if (alreadyCorrectState) {
          await expect(button).toHaveClass(includeClass("faded"));
          await tile.locator.click();
          await this.#rootLocator
            .getByTestId(`game-tile-index-${index}`)
            .focus();
          await this.#page.focus("body");
        } else if (
          (existingTileState === SuggestTileState.SuggestSword ||
            existingTileState === SuggestTileState.SuggestPresent) &&
          tileState === TileState.Empty
        ) {
          await expect(button).toHaveClass(includeClass("faded"));
          await button.click();
        } else if (expectInvalidMove) {
          await expect(button).toHaveClass(includeClass("faded"));
          await button.click();
        } else {
          await expect(button).not.toHaveClass(includeClass("faded"));
          await button.click();
        }
        await expect(popover).not.toBeVisible();
        expect(await tile.tileState()).toEqual(tileState);
      }
    });
  }

  syncToAsciiGrid(grid: string) {
    return this.applyInitialState(grid);
  }

  async actionsFromAsciiGrid(grid: string) {
    const { actions, expectedDatum, expectedPatternData, issues } =
      loadAsciiGrid(grid);
    {
      const firstIssue = expectedDatum.find(
        (d, i) =>
          d.prompt !== undefined ||
          d.recommended !== undefined ||
          (d.smartFill !== undefined && d.smartFill !== null) ||
          d.suggestions !== undefined ||
          (d.userSelection !== TileState.Unknown &&
            d.userSelection !== actions.find((a) => a.index === i)?.tileState)
      );
      if (firstIssue !== undefined) {
        throw new Error(
          `Only Actions must be provided, but expectedDatum contained information: ${JSON.stringify(firstIssue)}`
        );
      }
      if (
        expectedPatternData.patternIdentifier !== null ||
        expectedPatternData.remainingPatterns !== null
      ) {
        throw new Error(
          `Only Actions must be provided, but expectedPatternData contained information`
        );
      }
      if (issues.length > 0) {
        throw new Error(
          `Only Actions must be provided, but issues contained information`
        );
      }
    }
    for (const action of actions) {
      await this.setUserSelection(
        action.index,
        action.tileState,
        action.expectInvalidMove
      );
    }
  }

  protected override formatConcreteTileStates(
    source: FormatDataSource,
    index: number,
    data: { str: string },
    userSelected: TileState,
    smartFill: SmartFillTileState | null | undefined
  ) {
    // We can't explicitly set user selected states for smart fill states in the UI, so we normalize all smart fill values on both sides to user selected states.
    super.formatConcreteTileStates(
      source,
      index,
      data,
      userSelected !== TileState.Unknown
        ? userSelected
        : smartFill != null
          ? this.#smartFillToTile(smartFill)
          : TileState.Unknown,
      undefined
    );
  }

  protected override formatSuggestions(
    source: FormatDataSource,
    index: number,
    data: { str: string },
    prompt: CellTestData["prompt"],
    suggestion: CellTestData["suggestions"],
    recommended: boolean | undefined
  ) {
    if (source === FormatDataSource.Actual) {
      super.formatSuggestions(
        source,
        index,
        data,
        prompt,
        suggestion,
        recommended
      );
    } else {
      super.formatSuggestions(
        source,
        index,
        data,
        prompt,
        // The solver only provides tile suggestions for the recommended tile,
        // and then only provides a Yes or No indication for each possible suggestion for the recommended tiles
        // So, here we map from the suggestion weights to Yes or No indicator (1 or 0) if this tile is recommended,
        // Further, when a suggestion is being shown (in FillX mode), only that will be a primary (recommended) action.
        // Otherwise, we provide undefined.
        suggestion !== undefined
          ? {
              Sword:
                suggestion.Sword > 0 &&
                (prompt === undefined ||
                  prompt === SuggestTileState.SuggestSword)
                  ? 1
                  : 0,
              Present:
                suggestion.Present > 0 &&
                (prompt === undefined ||
                  prompt === SuggestTileState.SuggestPresent)
                  ? 1
                  : 0,
              Fox: suggestion.Fox > 0 ? 1 : 0,
            }
          : undefined,
        prompt !== undefined ? undefined : recommended
      );
    }
  }

  protected override formatIssues(
    source: FormatDataSource,
    issues: BoardIssue[]
  ): string[] {
    if (source === FormatDataSource.Expected) {
      // We don't currently support showing the issue tiles in the DOM
      return super.formatIssues(
        source,
        issues.map((i) => ({ ...i, issueTiles: [] }))
      );
    } else {
      return super.formatIssues(source, issues);
    }
  }

  protected getState(): Promise<TestGameStateSnapshot> {
    return test.step("get state", async () => {
      const cells: CellTestData[] = [];
      const board = this.#rootLocator.getByTestId("game-board");
      const boardTiles = await board
        .locator('[data-testid^="game-tile-index-"]')
        .all();
      let tileIndex = -1;
      for (const boardTile of boardTiles) {
        tileIndex++;
        await test.step(`index ${tileIndex}`, async () => {
          const tileDebugTile = `[Tile: ${tileIndex}]`;
          // const tile = await boardTile.getAttribute("data-test-tile");
          const classList = await boardTile.evaluate((e) =>
            Array.from(e.classList)
          );

          const cell: CellTestData = {};
          for (const className of classList) {
            if (className === "tile") {
              continue;
            }

            if (className === "nextTarget") {
              cell.recommended = true;
              continue;
            }

            if (this.#stringIsTileState(TileState, className)) {
              expect(
                cell.userSelection,
                `${tileDebugTile} had two (or more) user selection states: ${cell.userSelection}, ${className}`
              ).toBeUndefined();
              cell.userSelection = className;
            } else if (this.#stringIsTileState(SmartFillTileState, className)) {
              expect(
                cell.smartFill,
                `${tileDebugTile} had two (or more) smart fill selection states: ${cell.smartFill}, ${className}`
              ).toBeUndefined();
              cell.smartFill = className;
            } else if (this.#stringIsTileState(SuggestTileState, className)) {
              expect(
                cell.prompt,
                `${tileDebugTile} had two (or more) smart fill selection states: ${cell.prompt}, ${className}`
              ).toBeUndefined();
              cell.prompt = className;
            }
          }

          await boardTile.click();
          const primaryOptions = await this.getPopoverPrimaryOptions();
          cell.suggestions = {
            Fox: 0,
            Present: 0,
            Sword: 0,
          };

          // We skip loading suggestions for smart-fill because the expected test data does not include it (since it is implied by Smart Fill itself)
          if (cell.smartFill == null) {
            if (primaryOptions.includes(TileState.Sword)) {
              cell.suggestions.Sword = 1;
            }
            if (primaryOptions.includes(TileState.Present)) {
              cell.suggestions.Present = 1;
            }
            if (primaryOptions.includes(TileState.Fox)) {
              cell.suggestions.Fox = 1;
            }
          }

          const secondaryOptions = await this.getPopoverSecondaryOptions();

          const allOptions = [...primaryOptions, null, ...secondaryOptions];
          expect(allOptions, "All options should be unique").toEqual(
            Array.from(new Set(allOptions))
          );

          if (
            cell.userSelection !== undefined &&
            cell.userSelection !== TileState.Unknown
          ) {
            expect(secondaryOptions).toContain(cell.userSelection);
            expect(
              primaryOptions,
              "Should have no primary options (except Unknown) when the user has selected something"
            ).toHaveLength(1);
            expect(primaryOptions[0]).toEqual(TileState.Unknown);
          } else if (cell.smartFill === null || cell.smartFill === undefined) {
            for (const state of [
              TileState.Sword,
              TileState.Present,
              TileState.Fox,
            ] as const) {
              if (cell.suggestions[state] > 0) {
                expect(
                  primaryOptions.includes(state),
                  `${primaryOptions.join()} should include ${state}`
                ).toBe(true);
              } else {
                expect(
                  primaryOptions.includes(state),
                  `${primaryOptions.join()} should not include ${state}`
                ).toBe(false);
              }
            }
          } else {
            expect(primaryOptions).toHaveLength(0);
            expect(secondaryOptions).toHaveLength(0);
            const buttons = this.getAllPopoverButtons();
            await expect(buttons.nth(0)).not.toBeVisible();
            await expect(this.getPopover()).toContainText(
              `This tile must be a ${this.#smartFillToTile(cell.smartFill)} tile based on the other tiles on the board.`
            );
          }
          cells[tileIndex] = cell;
          await test.step(`Result ${JSON.stringify(cell)}`, () => {});
        });
      }

      const issues = await test.step("get board issues", async () =>
        await Promise.all(
          (await this.#page.locator("[data-test-issue-severity]").all()).map(
            async (l): Promise<BoardIssue> => ({
              severity: (await l.getAttribute(
                "data-test-issue-severity"
              )) as unknown as BoardIssue["severity"],
              message: await l.getByTestId("message").innerText(),
              issueTiles: [],
            })
          )
        ));

      return {
        cells,
        issues,
        patternData: await this.getPatternData(),
      };
    });
  }

  async #getPopoverOptionSet(rootSelector: string) {
    const tileStates: string[] = Array.from(Object.values(TileState));
    const popover = this.getPopover();
    const tiles: TileState[] = [];
    for (const item of await popover.getByTestId(rootSelector).all()) {
      const tileState = await item
        .locator("button")
        .getAttribute("data-test-tile-state");
      if (this.#stringIsTileState(TileState, tileState)) {
        tiles.push(tileState);
      } else {
        expect(
          tileStates,
          `${tileState} Should be a valid TileState (${tileStates.join()})`
        ).toContain(tileState);
      }
    }
    return tiles;
  }

  getPopoverPrimaryOptions() {
    return test.step("getPopoverPrimaryOptions", () =>
      this.#getPopoverOptionSet("popover-picker-primary-option"));
  }

  getPopoverSecondaryOptions() {
    return test.step("getPopoverSecondaryOptions", () =>
      this.#getPopoverOptionSet("popover-picker-secondary-option"));
  }

  getPattern() {
    return this.#rootLocator.getByTestId("pattern-identifier");
  }

  getRemainingPatterns() {
    return this.#rootLocator.getByTestId("remaining-patterns");
  }

  #stringIsTileState<T extends object>(
    tileStateEnum: T,
    value: unknown
  ): value is T[keyof T] {
    return Object.values(tileStateEnum).includes(value);
  }

  #smartFillToTile(smartFillTileState: SmartFillTileState | undefined) {
    return smartFillTileState === SmartFillTileState.SmartFillBlocked
      ? TileState.Blocked
      : smartFillTileState === SmartFillTileState.SmartFillPresent
        ? TileState.Present
        : smartFillTileState === SmartFillTileState.SmartFillSword
          ? TileState.Sword
          : assertUnreachable();
  }

  protected override eachIndex(
    array: CellTestData[]
  ): Iterable<[number, CellTestData]> {
    const items = Array.from(super.eachIndex(array));

    // Because the UI live updates as we enter data and blocks us from entering data in some cases (namely smart-fill),
    // we have to set values for the initial state in a particular order which avoids possible issues.
    items.sort((a, b) => {
      const tieBreak = a[0] - b[0];
      if (a[1].userSelection !== b[1].userSelection) {
        if (a[1].userSelection === TileState.Unknown) {
          return -1;
        } else if (b[1].userSelection === TileState.Unknown) {
          return 1;
        } else if (a[1].userSelection === TileState.Blocked) {
          return -1;
        } else if (b[1].userSelection === TileState.Blocked) {
          return 1;
        } else {
          return tieBreak;
        }
      } else if (a[1].smartFill !== b[1].smartFill) {
        if (a[1].smartFill === SmartFillTileState.SmartFillBlocked) {
          return -1;
        } else if (b[1].smartFill === SmartFillTileState.SmartFillBlocked) {
          return 1;
        } else {
          return tieBreak;
        }
      }
      return tieBreak;
    });

    return items;
  }
}
