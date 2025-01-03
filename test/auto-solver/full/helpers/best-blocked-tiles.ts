import {
  communityDataBlocksToIdentifier,
  CommunityDataIdentifiers,
} from "~/src/game/generated-community-data.js";
import { assertDefined } from "~/src/helpers.js";

// Find the smallest number of blocked tiles we need to fill in to uniquely identifier an identifier.
const _bestBlockedTilesForIdentifier = new Map<
  CommunityDataIdentifiers,
  number[]
>();
for (const [blockedStr, identifiers] of Object.entries(
  communityDataBlocksToIdentifier
)) {
  assertDefined(identifiers);
  const blocked = blockedStr.split(",").map((v) => parseInt(v, 10));
  if (identifiers.length === 1) {
    for (const identifier of identifiers) {
      const tiles = _bestBlockedTilesForIdentifier.get(identifier);
      if (tiles === undefined || tiles.length > blocked.length) {
        _bestBlockedTilesForIdentifier.set(identifier, blocked);
      }
    }
  }
}

export const bestBlockedTilesForIdentifier = _bestBlockedTilesForIdentifier;
