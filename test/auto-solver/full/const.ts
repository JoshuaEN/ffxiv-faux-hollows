export const FOXES_PER_PATTERN = 4;
export const ODDS_OF_NO_FOX = 9;
export const NO_FOX_MULTIPLIER = ODDS_OF_NO_FOX * FOXES_PER_PATTERN;
export const DISPLAY_NAME = {
  FoundSword: "Found Sword",
  FoundPresent: "Found Present",
  FoundSwordPresent: "Found Sword & Present",
  FoundFoxCandidates: "Four or less Fox Spots",
  UncoverFox: "Zero Fox Spots",
  UncoverSword: "Uncover Sword",
  UncoverPresent: "Uncover Present",
  UncoverSwordPresent: "Uncover Sword & Present",
  UncoverSwordFox: "Uncover Sword & Fox",
  UncoverPresentFox: "Uncover Present & Fox",
  UncoverAll: "Uncover All",
} as const;
