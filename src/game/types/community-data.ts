export interface CommunityDataPattern {
  /**
   * Top-left index of the Present (row first indexing)
   */
  readonly Present: number;
  /**
   * Top-left index of the Sword (row first indexing)
   */
  readonly Sword: number;
  /**
   * If the Sword is 3x2 (long side horizontal) or 3x2 (long side vertical)
   */
  readonly Sword3x2: boolean;
  /**
   * Indexes of confirmed foxes (row first indexing).
   */
  readonly ConfirmedFoxes: readonly number[];
}

export interface CommunityDataIdentifierPatterns {
  /**
   * Indexes of the blocked tiles for this pattern (row first indexing)
   */
  readonly Blocked: readonly number[];
  /**
   * Patterns for this arrangement of blocked tiles.
   */
  readonly Patterns: readonly CommunityDataPattern[];
}
