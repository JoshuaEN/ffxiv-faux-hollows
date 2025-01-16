import { allTestData } from "~/test/all-data-tests.js";
import { TestTag } from "~/test/framework.js";
import { test } from "~/test/playwright/fixtures.js";

allTestData(
  (ops, ...states) => {
    const { title, tags } =
      typeof ops === "string" ? { title: ops, tags: [] } : ops;
    const runTest =
      tags.includes(TestTag.ImpossibleUIState) === false &&
      tags.includes(TestTag.InvalidUIState) === false;

    if (runTest !== true) {
      return;
    }

    test(title, async ({ harness }) => {
      await harness.testSequence(states);
    });
  },
  { describe: test.describe }
);
