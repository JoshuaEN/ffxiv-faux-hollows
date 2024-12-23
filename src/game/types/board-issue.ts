export enum BoardIssueSeverity {
  Error = "Error",
}
export class BoardIssue {
  constructor(
    readonly severity: BoardIssueSeverity,
    readonly message: string,
    readonly issueTiles: Iterable<number>
  ) {}
}
