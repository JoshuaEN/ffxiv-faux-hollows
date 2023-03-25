import { expect, describe, test } from "vitest";
import { hash } from "./helpers.js";

describe("helpers", () => {
  describe("hash", () => {
    test("correctly hashes arrays", () => {
      // Arrange
      const array = [1, 2, 3];

      // Act
      const actual = hash(array);

      // Assert
      expect(actual).toEqual("1,2,3");
    });

    test("correctly hashes iterables", () => {
      // Arrange
      function* generator() {
        yield 1;
        yield 2;
        yield 3;
      }

      // Act
      const actual = hash(generator());

      // Assert
      expect(actual).toEqual("1,2,3");
    });

    test("correctly hashes empty collections", () => {
      // Arrange
      const array: number[] = [];

      // Act
      const actual = hash(array);

      // Assert
      expect(actual).toEqual("");
    });
  });
});
