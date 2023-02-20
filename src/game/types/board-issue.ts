export enum BoardIssueSeverity {
  Warning = "Warning",
  Error = "Error",
}
export class BoardIssue {
  constructor(
    readonly severity: BoardIssueSeverity,
    readonly message: string,
    readonly issueTiles: Iterable<number>
  ) {}
}
