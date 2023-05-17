import { data as blockedSmartFillData } from "./data/blocked-smart-fill.data.js";
import { data as foxSuggestionsData } from "./data/fox-suggestions.data.js";
import { data as presentsSmartFillData } from "./data/presents-smart-fill.data.js";
import { data as smartFillEdgeCasesData } from "./data/smart-fill-edge-cases.data.js";
import { data as swordSmartFillData } from "./data/sword-smart-fill.data.js";
import { RegisterTest } from "./framework.js";

export interface TestStructuralElements {
  describe: (title: string, callback: () => void) => void;
}

export function allTestData(
  registerSequence: RegisterTest,
  elements: TestStructuralElements
) {
  blockedSmartFillData(registerSequence, elements);
  foxSuggestionsData(registerSequence, elements);
  presentsSmartFillData(registerSequence, elements);
  smartFillEdgeCasesData(registerSequence, elements);
  swordSmartFillData(registerSequence, elements);
}
