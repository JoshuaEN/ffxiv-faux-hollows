import { TestStructuralElements } from "../all-data-tests.js";
import { RegisterTest } from "../framework.js";

export const data = (
  registerTest: RegisterTest,
  { describe }: TestStructuralElements
) => {
  describe("Sword Smart-Fill", () => {
    registerTest(
      `Basic Test`,
      `
        ┌─────┬─────┬─────┬─────┬─────┬─────┐
        │     │     │     │     │ B   │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │ B   │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │ B   │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │ B   │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │ B   │     │     │
        └─────┴─────┴─────┴─────┴─────┴─────┘
      `,
      `
        ID C
        ## 4
        ┌─────┬─────┬─────┬─────┬─────┬─────┐
        │     │.  2 │. 1  │. 1  │ B   │.  2 │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │.  2 │ B   │. 1  │. 1  │.  2 │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │. 1  │* 2  │. 12 │ B   │     │.  2 │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │. 1  │* 2  │. 2  │. 1  │  s  │  s  │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │ B   │. 12 │. 1  │  s  │  s  │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │.  2 │     │     │ B   │  s  │>S   │
        └─────┴─────┴─────┴─────┴─────┴─────┘
      `
    );
    registerTest(
      `Correctly smart fill based on diagonal data (3x2)`,
      `
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │ B   │     │ B   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ B   │     │     │ S   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ E   │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ P   │     │ B   │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │ B   │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `,
      `
      ID A
      ## 1
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │?f  1│     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │ B   │     │ B   │?f  1│
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ B   │  s  │  s  │ S   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ E   │>S   │  s  │  s  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ P   │  p  │ B   │     │     │?f  1│
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │  p  │  p  │?f  1│     │     │ B   │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `
    );
    registerTest(
      `Correctly smart fill based on diagonal data (2x3)`,
      `
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │ B   │     │ B   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ B   │     │ S   │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ P   │     │ B   │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ E   │     │     │     │ B   │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `,
      `
      ID A
      ## 1
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │ B   │?f  1│ B   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ B   │     │ S   │  s  │?f  1│
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │  p  │  p  │     │  s  │  s  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ P   │  p  │ B   │  s  │>S   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ E   │     │?f  1│?f  1│ B   │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `
    );
    registerTest(
      `Correctly smart fill based on a horizontal line with one side blocked`,
      `
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │ B   │     │ B   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ B   │     │     │ S   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ E   │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ P   │     │ B   │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │ B   │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `,
      `
      ID A
      ## 1
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │?f  1│     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │ B   │     │ B   │?f  1│
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ B   │>S   │  s  │ S   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ E   │  s  │  s  │  s  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ P   │  p  │ B   │     │     │?f  1│
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │  p  │  p  │?f  1│     │     │ B   │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `
    );
    registerTest(
      `Correctly smart fill based on a vertical line with one side blocked`,
      `
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │ B   │     │ B   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ B   │     │ S   │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ P   │     │ B   │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ E   │     │     │     │ B   │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `,
      `
      ID A
      ## 1
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │ B   │?f  1│ B   │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ B   │     │ S   │  s  │?f  1│
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │  p  │  p  │     │  s  │  s  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ P   │  p  │ B   │>S   │  s  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ E   │     │?f  1│?f  1│ B   │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `
    );
    registerTest(
      `Correctly smart fill against top-left edge`,
      `
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │     │     │ B   │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │ B   │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │ P   │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │ B   │     │ P   │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │ B   │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │ B   │     │     │     │     │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `,
      `
      ID C↓
      ## 1
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │>S   │  s  │ B   │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │  s  │  s  │     │?f  1│ B   │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │  s  │  s  │     │ P   │  p  │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │?f  1│     │ B   │  p  │ P   │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │?f  1│     │     │ B   │?f  1│
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │ B   │     │     │     │     │
    └─────┴─────┴─────┴─────┴─────┴─────┘
`
    );
    registerTest(
      `Correctly smart fill against top-right edge`,
      `
        ┌─────┬─────┬─────┬─────┬─────┬─────┐
        │     │     │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │ B   │     │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │ P   │     │ B   │     │     │ B   │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │ P   │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │ B   │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │     │     │     │
        └─────┴─────┴─────┴─────┴─────┴─────┘
      `,
      `
      ID C←
      ## 1
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │?f  1│  s  │  s  │>S   │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ B   │?f  1│     │  s  │  s  │  s  │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ P   │  p  │ B   │     │     │ B   │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │  p  │ P   │     │     │?f  1│     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ B   │     │     │  b  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │?f  1│     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `
    );
    registerTest(
      `Correctly smart fill against bottom-left edge`,
      `
        ┌─────┬─────┬─────┬─────┬─────┬─────┐
        │     │     │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │ B   │     │     │ B   │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │ P   │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │ B   │ P   │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │     │     │     │
        └─────┴─────┴─────┴─────┴─────┴─────┘
      `,
      `
      ID C→
      ## 1
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │?f  1│     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │ B   │     │     │ B   │?f  1│
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │  p  │ P   │?f  1│     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │ B   │ P   │  p  │  b  │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │>S   │  s  │  s  │     │     │  b  │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │  s  │  s  │  s  │     │     │?f  1│
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `
    );
    registerTest(
      `Correctly smart fill against bottom-right edge`,
      `
        ┌─────┬─────┬─────┬─────┬─────┬─────┐
        │     │     │ P   │     │ B   │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │ B   │     │ P   │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │ B   │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │     │     │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │ B   │     │     │
        └─────┴─────┴─────┴─────┴─────┴─────┘
      `,
      `
        ID C
        ## 1
        ┌─────┬─────┬─────┬─────┬─────┬─────┐
        │     │     │ P   │  p  │ B   │     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │?f  1│ B   │  p  │ P   │?f  1│     │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │ B   │     │?f  1│
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │     │  s  │  s  │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │  b  │?f  1│     │  s  │  s  │
        ├─────┼─────┼─────┼─────┼─────┼─────┤
        │     │     │     │ B   │>S   │  s  │
        └─────┴─────┴─────┴─────┴─────┴─────┘
      `
    );
  });
};
