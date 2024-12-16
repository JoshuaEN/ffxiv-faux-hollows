import { TileState } from "../game/types/tile-states.js";

export const TileStateDisplayName: Record<TileState, string> = {
  [TileState.Blocked]: TileState.Blocked,
  [TileState.Empty]: TileState.Empty,
  [TileState.Fox]: TileState.Fox,
  [TileState.Present]: "Gift Box",
  [TileState.Sword]: TileState.Sword,
  [TileState.Unknown]: TileState.Unknown,
};
