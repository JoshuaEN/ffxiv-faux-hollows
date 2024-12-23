export enum TileState {
  Unknown = "Unknown",
  Empty = "Empty",
  Blocked = "Blocked",
  Present = "Present",
  Sword = "Sword",
  Fox = "Fox",
}

/**
 * Tile states which we are searching for (targeting) when solving
 */
export type TargetTileState =
  | TileState.Blocked
  | TileState.Present
  | TileState.Sword
  | TileState.Fox;

export enum SmartFillTileState {
  SmartFillBlocked = "SmartFillBlocked",
  SmartFillPresent = "SmartFillPresent",
  SmartFillSword = "SmartFillSword",
}

export enum SuggestTileState {
  SuggestPresent = "SuggestPresent",
  SuggestSword = "SuggestSword",
  SuggestFox = "SuggestFox",
}

export type CombinedTileState =
  | TileState
  | SmartFillTileState
  | SuggestTileState
  | SuggestTileState[];

/**
 * List of indexes where each of these tracked states is
 */
export interface TrackedStatesIndexList<
  TSet extends Set<number> | ReadonlySet<number>,
> {
  readonly [TileState.Blocked]: TSet;
  readonly [TileState.Present]: TSet;
  readonly [TileState.Sword]: TSet;
  readonly [TileState.Fox]: TSet;
  readonly [TileState.Empty]: TSet;
}
