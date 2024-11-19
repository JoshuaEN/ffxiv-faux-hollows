# Solve Methods

Solve methods, generally, refer to the approach for determining the best tile(s) to recommend the user select next when playing Faux Hollows.

Note that this evaluation ignores providing additional information to the tool (the location of the blocked tiles and the actual location of a Sword/Present when a single tile is uncovered), as these are considered fully optimized already.

## Concepts

The only concept (aside from understanding Faux Hollows) worth mentioning is "smart fill". Smart fill refers to when, based on the board pattern (the location of the blocked tiles) and the user's prior input, a tile must be a specific tile (Blocked, Sword, or Present). In these cases, the tile will be "smart filled" with the correct tile[1](#footnote-1).

## Levers

There are two different "levers" which can be adjusted independently which have been evaluated. The solver and the weighter.

The solver calculates candidate tile state for each tile (basically, the base values for Sword, Present, and Fox which are fed into the weighter). The solver also calculates smart fills.

The weighter takes the Sword, Present, and Fox values from the solver and applies a function to them. The basic way to read the weighter is:

```
<weighter> = <tileTypeWeight>

<tileTypeWeight> = <tileType><tileWeight>

<tileType> = "s" | "p" | "f" # Sword, Present, and Fox respectively.

<tileWeight> = <number>

<disambiguationDelimiter> = "-" # This indicates the numbers on the right side of this marker are only used to tiebreak the numbers on the left side. E.g. s6p4-f1 means fox is only considered when comparing two tiles with equal Sword and Present weights.
```

# Reading Result Logs

## Totals

To save time, short-circuit logic is used when evaluating a board state with both the Sword and Present located.

At this point, there is a static number of possible steps left based on how many candidate locations for the fox remain (if the fox has not already been found).

With this in mind, _Total variations calculated_ is the total result set with the short-circuit logic. These results have a min and max value for the Fox and All/Total step values. TThe full listing of this is printed at the bottom of the result log.

_Total variations explored_ is the number of board states if we didn't short-circuit; this result set is actually generated from the "total variations calculated" and used to generate the _Total after deduplication_, which is the "Total variations explored" with inconsequential variations removed.

An "inconsequential variations" occurs when two or more variations have the same step numbers across the board. In this case, only one is kept and the remainder are removed. This ignores the steps themselves (which are unique), but naturally accounts for meaningful differences in the steps.

For example (A up):

```
  ▯16 ◻0
     Fox at 3
       t[3,6] T[11,14] s1 S6 p2 P5 F[3,6] SF[8,11] PF[6,9] | -> 22->S, 0->P
       t[3,6] T[11,14] s1 S6 p2 P5 F[3,6] SF[8,11] PF[6,9] | -> 22->S, 1->P
       t[3,6] T[11,14] s1 S6 p2 P5 F[3,6] SF[8,11] PF[6,9] | -> 22->S, 6->P
       t[3,6] T[11,14] s1 S6 p2 P5 F[3,6] SF[8,11] PF[6,9] | -> 22->S, 7->P
```

Here we have four different possibilities which give the same result. Keeping all four skews averages, because if one approach reports just one of these Present options and another reports all four, they are effectively equal but when compared against the entire data set the approach with all four may appear better or worse (other things equal) depending on if 2 steps to solve is better or worse than average.

# Footnotes

## Footnote 1

There is a case where this is does not hold true: If the tile type being smart filled is not fully smart filled (e.g. we know a present must be in a specific tile, but we do not know what all four present tiles are), we instead mark these tiles as suggestions with the highest priority.

This is necessary because we need the user to select one of the known tiles to be able to tell us where the actual shape is.
