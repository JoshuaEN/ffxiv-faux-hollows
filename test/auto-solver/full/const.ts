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

export enum FoxNoFoxFlag {
  NoFox = "",
  Fox = " ",
}
