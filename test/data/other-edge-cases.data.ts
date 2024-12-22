import { TestStructuralElements } from "../all-data-tests.js";
import { RegisterTest } from "../framework.js";

export const data = (
  registerTest: RegisterTest,
  { describe }: TestStructuralElements
) => {
  describe("Other Edge cases", () => {
    registerTest(
      `3 fox locations empty`,
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
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │     │>E4  │     │     │ B   │>E5  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │ B   │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │>P3  │  p  │>E6  │ B   │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │  p  │  p  │     │     │>S1  │  s  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │ B   │     │     │  s  │  s  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │?f  1│     │     │ B   │  s  │>S2  │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `
    );
    registerTest(
      `All fox locations empty`,
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
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │     │>E4  │     │     │ B   │>E5  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │ B   │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │>P3  │  p  │>E6  │ B   │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │  p  │  p  │     │     │>S1  │  s  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │ B   │     │     │  s  │  s  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │>E7  │     │     │ B   │  s  │>S2  │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `
    );
  });
};
