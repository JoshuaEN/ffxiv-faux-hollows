import { MAX_BLOCKED } from "../constants";
import {
  communityDataBlocksToIdentifier,
  communityDataByIdentifier,
  CommunityDataIdentifiers,
} from "../generated-community-data";
import { hash } from "../helpers";
import {
  BoardIssue,
  BoardIssueSeverity,
  CommunityDataIdentifierPatterns,
} from "../types";

export function getIdentifierCandidates(blockedIndexes: ReadonlySet<number>): {
  identifierCandidates: readonly CommunityDataIdentifierPatterns[];
  patternIdentifierCandidates: readonly string[];
  error?: BoardIssue;
  warning?: BoardIssue;
} {
  let patternIdentifierCandidates: readonly CommunityDataIdentifiers[];
  switch (blockedIndexes.size) {
    case 5:
    case 3:
    case 2:
    case 1: {
      patternIdentifierCandidates =
        communityDataBlocksToIdentifier[hash(blockedIndexes)] ?? [];
      break;
    }
    case 0: {
      return { identifierCandidates: [], patternIdentifierCandidates: [] };
    }
    case 4: {
      // The community data lookup table does not have 4 because only 3 spots are needed to uniquely identify a board position
      // So, we randomly remove one of the blocked elements (the lookup has all possible combinations) to use the 3 index lookup instead
      patternIdentifierCandidates =
        communityDataBlocksToIdentifier[
          hash(Array.from(blockedIndexes).slice(0, -1))
        ] ?? [];
      break;
    }
    default: {
      return {
        identifierCandidates: [],
        patternIdentifierCandidates: [],
        error: new BoardIssue(
          BoardIssueSeverity.Error,
          `Board has ${blockedIndexes.size} blocked tiles, but there should only be ${MAX_BLOCKED}.`,
          blockedIndexes
        ),
      };
    }
  }
  const identifierCandidates = patternIdentifierCandidates.map(
    (c) => communityDataByIdentifier[c]
  );
  if (identifierCandidates.length === 0 && blockedIndexes.size === 5) {
    // We are missing the pattern the user provided
    // We cannot provide any Fox suggestions, but we can provide a best-effort
    return {
      identifierCandidates: [
        { Patterns: [], Blocked: Array.from(blockedIndexes) },
      ],
      patternIdentifierCandidates: ["??"],
      warning: new BoardIssue(
        BoardIssueSeverity.Warning,
        `Blocked tile pattern does not match any known patterns; Fox suggestions are not available.`,
        []
      ),
    };
  }
  return { identifierCandidates, patternIdentifierCandidates };
}
