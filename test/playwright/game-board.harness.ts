import { expect, Locator, Page, PlaywrightTestArgs } from "@playwright/test";
import {
  BoardIssue,
  SmartFillTileState,
  SuggestTileState,
  TileState,
} from "~/src/game/types/index.js";
import { BaseSequenceRunner, FormatDataSource } from "../framework.js";
import { CellTestData } from "../helpers/ascii-grid.js";

export class GameBoardHarness extends BaseSequenceRunner {
  readonly #rootLocator: Locator;
  readonly #page: Page;
  constructor(rootLocator: Locator, args: PlaywrightTestArgs) {
    super(
      (message: string) => expect("FAIL", message).toBeFalsy() as never,
      expect
    );
    this.#rootLocator = rootLocator;
    this.#page = args.page;
  }

  #getTile(index: number) {
    const locator = this.#rootLocator.getByTestId(`game-tile-index-${index}`);
    const tileData = {
      locator,
      combinedTileState: async () => {
        return (await locator.getAttribute("data-test-tile"))?.split(",") ?? [];
      },
      tileState: async (): Promise<TileState> => {
        const combined = await tileData.combinedTileState();
        if (
          combined.length === 1 &&
          this.#stringIsTileState(TileState, combined[0])
        ) {
          return combined[0];
        } else {
          return TileState.Unknown;
        }
      },
    };
    return tileData;
  }

  async getTileState(index: number) {
    return await this.#getTile(index).tileState();
  }

  getTileLocator(index: number) {
    return this.#getTile(index).locator;
  }

  getPopover() {
    return this.#rootLocator.getByTestId("popover-picker");
  }

  async setUserSelection(index: number, tileState: TileState) {
    const tile = this.#getTile(index);
    const alreadyCorrectState = (await tile.tileState()) === tileState;

    await tile.locator.click();

    const popover = this.getPopover();
    await expect(popover).toBeVisible();

    const button = popover.getByTestId(`popover-picker-button-${tileState}`);

    if (alreadyCorrectState) {
      await expect(button).not.toBeVisible();
      await this.#rootLocator.getByTestId(`game-tile-index-${index}`).focus();
      await this.#page.focus("body");
    } else {
      await expect(button).toBeVisible();
      await button.click();
    }

    await expect(popover).not.toBeVisible();
    expect(await tile.tileState()).toEqual(tileState);
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
        // Otherwise, we provide undefined.
        suggestion !== undefined
          ? {
              Sword: suggestion.Sword > 0 ? 1 : 0,
              Present: suggestion.Present > 0 ? 1 : 0,
              // Fox is not currently supported by the Actual loader
              // Fox: suggestion.Fox > 0 ? 1 : 0,
              Fox: 0,
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

  protected async getState(): Promise<{
    cells: CellTestData[];
    issues: BoardIssue[];
    debug?: string | undefined;
  }> {
    const cells: CellTestData[] = [];
    const board = this.#rootLocator.getByTestId("game-board");
    const boardTiles = await board
      .locator('[data-testid^="game-tile-index-"]')
      .all();
    let tileIndex = -1;
    for (const boardTile of boardTiles) {
      tileIndex++;
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
      if (primaryOptions.includes(TileState.Sword)) {
        cell.suggestions.Sword = 1;
      }
      if (primaryOptions.includes(TileState.Present)) {
        cell.suggestions.Present = 1;
      }
      if (primaryOptions.includes(TileState.Fox)) {
        cell.suggestions.Fox = 1;
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
        expect(
          allOptions.includes(cell.userSelection),
          "The selected option should not be a primary or secondary suggestion"
        ).toEqual(false);
        expect(
          primaryOptions,
          "Should have no primary options when the user has selected something"
        ).toHaveLength(1);
        if (cell.userSelection === TileState.Empty) {
          expect(primaryOptions[0]).toEqual(TileState.Unknown);
        } else {
          expect(primaryOptions[0]).toEqual(TileState.Empty);
        }
      } else {
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
      }
      cells[tileIndex] = cell;
    }

    const issues = await Promise.all(
      (
        await this.#page.getByTestId("board-issue").all()
      ).map(
        async (l): Promise<BoardIssue> => ({
          severity: (
            await l.getByTestId("severity").first().innerText()
          ).slice(1, -1) as unknown as BoardIssue["severity"],
          message: await l.getByTestId("message").innerText(),
          issueTiles: [],
        })
      )
    );

    return {
      cells,
      issues,
    };
  }

  async #getPopoverOptionSet(rootSelector: string) {
    const tileStates: string[] = Array.from(Object.values(TileState));
    const popover = this.#rootLocator.getByTestId("popover-picker");
    const tiles: TileState[] = [];
    for (const item of await popover.getByTestId(rootSelector).all()) {
      const classList = await item
        .locator("button")
        .evaluate((e) => Array.from(e.classList));
      expect(classList.length, "Only the tile should be present").toBeLessThan(
        2
      );
      for (const className of classList) {
        if (this.#stringIsTileState(TileState, className)) {
          tiles.push(className);
        } else {
          expect(
            tileStates.includes(className),
            `${className} Should be a valid TileState (${tileStates.join()})`
          ).toBe(true);
        }
      }
    }
    return tiles;
  }

  getPopoverPrimaryOptions() {
    return this.#getPopoverOptionSet("popover-picker-primary-option");
  }

  getPopoverSecondaryOptions() {
    return this.#getPopoverOptionSet("popover-picker-secondary-option");
  }

  #stringIsTileState<T extends object>(
    tileStateEnum: T,
    value: unknown
  ): value is T[keyof T] {
    return Object.values(tileStateEnum).includes(value);
  }
}
