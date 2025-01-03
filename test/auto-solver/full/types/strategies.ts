import { TileState } from "~/src/game/types/tile-states.js";

export const STRATEGY_SwordPresent = [
  TileState.Sword,
  TileState.Present,
] as const;
export const STRATEGY_SwordFox = [TileState.Sword, TileState.Fox] as const;
export const STRATEGY_PresentFox = [TileState.Present, TileState.Fox] as const;
export const STRATEGY_Fox = [TileState.Fox] as const;
export const STRATEGY_All = [
  TileState.Sword,
  TileState.Present,
  TileState.Fox,
] as const;
export const STRATEGIES = [
  STRATEGY_SwordPresent,
  STRATEGY_SwordFox,
  STRATEGY_PresentFox,
  STRATEGY_Fox,
  STRATEGY_All,
] as const;
export type AutoSolveStrategy = (typeof STRATEGIES)[number];
