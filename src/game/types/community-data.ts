export interface CommunityDataPattern {
  readonly Present: number;
  readonly Sword: number;
  readonly Sword3x2: boolean;
  readonly ConfirmedFoxes: readonly number[];
  readonly UnconfirmedFoxes: readonly number[];
}
export interface CommunityDataIdentifierPatterns {
  readonly Blocked: readonly number[];
  readonly Patterns: readonly CommunityDataPattern[];
}
