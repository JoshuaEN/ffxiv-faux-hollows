# Overview

The result logs in here are used to compare different solve methods and provide statistics on the approximate odds of success with various strategies.

> [!NOTE]
> These statistics are one interpretation of the data.
>
> The heart of the problem is the most useful statistics are the percentage odds of achieving a strategy in 11 or less moves; but a percentage of what?
>
> [03 - Solve Approaches.md](./03%20-%20Solve%20Approaches.md) goes in depth into what the percentages mean in this interpretation.

## Concepts

### Faux Hollows

Faux Hollows is a mini-game in the video game Final Fantasy XIV. It revolves around finding three shapes on a 6x6 grid: A 2x3 (or 3x2) shape, a 2x2 shape, and a 1x1 shape.

There are initially 5 tiles which cannot have a shape overlap them, from there a player has 11 moves to try and uncover as many of the shapes as possible. The 2x3 shape provides the least points, while the 1x1 provides the most.

This is further complicated by there being a limited number of possible permutations of all blocked tiles and shapes ([found via a community effort and compiled by u/Ylandah](https://docs.google.com/spreadsheets/d/1mUyCzlzDmdXMwaSTUgWXtEA45oJNn-iB4_bVM43zf58/edit?gid=49331949#gid=49331949")).

### Smart fill

Smart fill refers to when, based on the board pattern (the location of the blocked tiles) and the user's prior input, a tile must be a specific tile (Blocked, Sword, or Present). In these cases, the tile will be "smart filled" with the correct tile<sup>[[1]](#footnote-1)</sup>.

### Solver

The solver calculates candidate tile state for each tile (basically, the base values for Sword, Present, and Fox which are fed into the weighter). The solver also calculates smart fills.

# Footnotes

## Footnote 1

There is a case where this is does not hold true: If the tile type being smart filled is not fully smart filled (e.g. we know a present must be in a specific tile, but we do not know what all four present tiles are), we instead mark these tiles as suggestions with the highest priority.

This is necessary because we need the user to select one of the known tiles to be able to tell where the actual shape is.
