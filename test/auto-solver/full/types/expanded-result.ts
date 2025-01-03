export interface AutoSolveExpandedResultStepsTo {
  // Un-prefixed means the exact location of the shape has been found.
  // Note: The shape may not have any tiles revealed, if the shape can be found by process of elimination.
  FoundSword: number;
  FoundPresent: number;
  FoundSwordPresent: number;
  /**
   * "Found" means there are 4 or less possible fox positions remaining
   */
  FoundFoxCandidates: number;
  FoundAll: number;

  // Uncover means fully revealing the shape
  // Each of these is "ASAP", meaning if we uncover a Sword tile on move one, UncoverSword would 6
  // (and if we found the Sword by elimination on move one, UncoverSword would be 7)
  UncoverSword: number;
  UncoverPresent: number;
  UncoverSwordPresent: number;
  /**
   * "Uncover" means the fox was found OR there are no more possible fox positions
   */
  UncoverFox: number;
  UncoverSwordFox: number;
  UncoverPresentFox: number;
  UncoverAll: number;

  // Number of additional steps to fully uncover the target after finding the tile
  swordFullSteps: number;
  presentFullSteps: number;
}
