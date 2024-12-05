import { TileState } from "~/src/game/types/tile-states.js";
import { AutoSolveExpandedResult } from "./generate-summaries.js";
import { assert } from "~/src/helpers.js";

export function deduplicateSummaries(summaries: AutoSolveExpandedResult[]) {
  const deduplicatedSummaries: AutoSolveExpandedResult[] = [];

  {
    const deduplicatedSummariesMap = new Map<string, AutoSolveExpandedResult>();

    for (const summary of summaries) {
      const key = `
      ${summary.blocked.join(",")}
      ${summary.pattern.Sword}${summary.pattern.Sword3x2}
      ${summary.pattern.Present}
      ${summary.foxIndex}
      |
      ${summary.stepsTo.totalSteps}
      ${summary.stepsTo[TileState.Sword]}
      ${summary.stepsTo[TileState.Present]}
      ${summary.stepsTo.fullSword}
      ${summary.stepsTo.fullPresent}
      ${summary.stepsTo[TileState.Fox]}
      ${summary.stepsTo.bestFox}
      ${summary.stepsTo.bestSwordFox}
      ${summary.stepsTo.bestPresentFox}`;

      const existing = deduplicatedSummariesMap.get(key);
      if (existing !== undefined) {
        assert(
          existing.stepsTo[TileState.Sword] === summary.stepsTo[TileState.Sword]
        );
        assert(
          existing.stepsTo[TileState.Present] ===
            summary.stepsTo[TileState.Present]
        );
        assert(
          existing.stepsTo[TileState.Fox] === summary.stepsTo[TileState.Fox]
        );
        assert(existing.stepsTo.totalSteps === summary.stepsTo.totalSteps);
        assert(
          existing.stepsTo.fullSwordPresent === summary.stepsTo.fullSwordPresent
        );
        assert(existing.stepsTo.fullTotal === summary.stepsTo.fullTotal);
      } else {
        deduplicatedSummariesMap.set(key, summary);
        deduplicatedSummaries.push(summary);
      }
    }
  }
  return deduplicatedSummaries;
}
