import { describe, expect, test } from "vitest";
import { BoundingBox, getBoundingBox } from "./helpers.js";

describe("helpers", () => {
  describe("BoundingBox", () => {
    describe("constructor", () => {
      test("Creates a bounding box", () => {
        // Arrange
        const x = 2,
          y = 3,
          width = 4,
          height = 5;

        // Act
        const box = new BoundingBox(x, y, width, height);

        // Assert
        assertBoxEquals(box, {
          x,
          y,
          width,
          height,
          shortSide: width,
          longSide: height,
        });
      });

      test("Creates a bounding box where the width is shorter", () => {
        // Arrange
        const x = 2,
          y = 3,
          width = 10,
          height = 15;

        // Act
        const box = new BoundingBox(x, y, width, height);

        // Assert
        assertBoxEquals(box, {
          x,
          y,
          width,
          height,
          shortSide: width,
          longSide: height,
        });
      });
      test("Creates a bounding box where the width is longer", () => {
        // Arrange
        const x = 2,
          y = 3,
          width = 15,
          height = 10;

        // Act
        const box = new BoundingBox(x, y, width, height);

        // Assert
        assertBoxEquals(box, {
          x,
          y,
          width,
          height,
          shortSide: height,
          longSide: width,
        });
      });
    });
  });
  describe("getBoundingBox", () => {
    test("generates a bounding box from zero indexes", () => {
      // Arrange
      const indexes = new Set([]);

      // Act
      const actual = getBoundingBox(indexes);

      // Assert
      assertBoxEquals(actual, null);
    });
    test("generates a bounding box from one index", () => {
      // Arrange
      const indexes = new Set([1]);

      // Act
      const actual = getBoundingBox(indexes);

      // Assert
      assertBoxEquals(actual, {
        x: 1,
        y: 0,
        width: 1,
        height: 1,
        shortSide: 1,
        longSide: 1,
      });
    });
    test("generates a bounding box from two indexes", () => {
      // Arrange
      const indexes = new Set([1, 8]);

      // Act
      const actual = getBoundingBox(indexes);

      // Assert
      assertBoxEquals(actual, {
        x: 1,
        y: 0,
        width: 2,
        height: 2,
        shortSide: 2,
        longSide: 2,
      });
    });
    test("generates a bounding box from three indexes", () => {
      // Arrange
      const indexes = new Set([1, 2, 8]);

      // Act
      const actual = getBoundingBox(indexes);

      // Assert
      assertBoxEquals(actual, {
        x: 1,
        y: 0,
        width: 2,
        height: 2,
        shortSide: 2,
        longSide: 2,
      });
    });
    test("generates a bounding box where the width is longer", () => {
      // Arrange
      const indexes = new Set([1, 3, 8]);

      // Act
      const actual = getBoundingBox(indexes);

      // Assert
      assertBoxEquals(actual, {
        x: 1,
        y: 0,
        width: 3,
        height: 2,
        shortSide: 2,
        longSide: 3,
      });
    });
    test("generates a bounding box where the width is shorter", () => {
      // Arrange
      const indexes = new Set([1, 8, 13]);

      // Act
      const actual = getBoundingBox(indexes);

      // Assert
      assertBoxEquals(actual, {
        x: 1,
        y: 0,
        width: 2,
        height: 3,
        shortSide: 2,
        longSide: 3,
      });
    });
    test("generates a bounding box in a straight line (horizontal)", () => {
      // Arrange
      const indexes = new Set([1, 2, 3]);

      // Act
      const actual = getBoundingBox(indexes);

      // Assert
      assertBoxEquals(actual, {
        x: 1,
        y: 0,
        width: 3,
        height: 1,
        shortSide: 1,
        longSide: 3,
      });
    });
    test("generates a bounding box in a straight line (vertical)", () => {
      // Arrange
      const indexes = new Set([1, 7, 13]);

      // Act
      const actual = getBoundingBox(indexes);

      // Assert
      assertBoxEquals(actual, {
        x: 1,
        y: 0,
        width: 1,
        height: 3,
        shortSide: 1,
        longSide: 3,
      });
    });
  });

  function assertBoxEquals(
    actual: BoundingBox | null,
    expected: {
      x: number;
      y: number;
      width: number;
      height: number;
      shortSide: number;
      longSide: number;
    } | null
  ) {
    expect(
      actual === null
        ? null
        : {
            x: actual.x,
            y: actual.y,
            width: actual.width,
            height: actual.height,
            shortSide: actual.shortSide,
            longSide: actual.longSide,
          }
    ).toEqual(expected);
  }
});
