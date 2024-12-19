import { assertUnreachable } from "~/src/helpers.js";
import {
  CalculateStatesCandidatesFunction,
  CalculateSuggestionWeight,
} from "../../types/solver-modules.js";
import * as communityDataWeightedCalculator from "./calculate-state-candidates/community-data-state-candidates/weighted.js";
import * as communityDataFoxOmitsCalculator from "./calculate-state-candidates/community-data-state-candidates/fox-omits.js";
import * as communityDataBuckets from "./calculate-state-candidates/community-data-state-candidates/buckets.js";
import * as communityDataRecursive from "./calculate-state-candidates/community-data-state-candidates/recursive.js";
import * as communityDataRecursiveFast from "./calculate-state-candidates/community-data-state-candidates/recursive-fast.js";
import * as communityDataCalculator from "./calculate-state-candidates/community-data-state-candidates.js";
import * as pureWeightedCalculator from "./calculate-state-candidates/pure-weighted-state-candidates.js";

export const calculateStatesCandidates: CalculateStatesCandidatesFunction =
  import.meta.env["SOLVER"] === "pure-weighted"
    ? pureWeightedCalculator.calculateStatesCandidates
    : import.meta.env["SOLVER"] === "community-data"
      ? communityDataCalculator.calculateStatesCandidates
      : import.meta.env["SOLVER"] === "community-data-fox-omits"
        ? communityDataFoxOmitsCalculator.calculateStatesCandidates
        : import.meta.env["SOLVER"] === "community-data-weighted"
          ? communityDataWeightedCalculator.calculateStatesCandidates
          : import.meta.env["SOLVER"] === "community-data-buckets"
            ? communityDataBuckets.calculateStatesCandidates
            : import.meta.env["SOLVER"] === "community-data-recursive"
              ? communityDataRecursive.calculateStatesCandidates
              : import.meta.env["SOLVER"] === "community-data-recursive-fast" ||
                  import.meta.env.MODE === "test"
                ? communityDataRecursiveFast.calculateStatesCandidates
                : assertUnreachable();

import * as s6p4_f1 from "./calculate-suggestion-weight/s6p4-f1-weighter.js";
import * as s6p4f1 from "./calculate-suggestion-weight/s6p4f1-weighter.js";
import * as s1 from "./calculate-suggestion-weight/s1-weighter.js";

export const calculateSuggestionWeight: CalculateSuggestionWeight =
  import.meta.env["WEIGHTER"] === "s6p4-f1"
    ? s6p4_f1.calculateSuggestionWeight
    : import.meta.env["WEIGHTER"] === "s6p4f1"
      ? s6p4f1.calculateSuggestionWeight
      : import.meta.env["WEIGHTER"] === "s1" || import.meta.env.MODE === "test"
        ? s1.calculateSuggestionWeight
        : assertUnreachable();
