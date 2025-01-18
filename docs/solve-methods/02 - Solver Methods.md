# Solver Methods

Solve methods, generally, refer to the approach for determining the best tile(s) to recommend the user uncover next when playing Faux Hollows.

Several solve approaches have been explored:

## Recursive Solver

The recursive solver simulates every possible move for the current state, averaging the steps from the current state to the point the board is solved for each possible move. The moves which have the lowest average are then shown as recommended.

Recursive fast is the recursive solver with the first step of all patterns being pre-solved. This is a significant performance boost on slower devices.

This is the approach currently used.

## Buckets

The buckets solver suggests the tile(s) based on how well distributed the patterns would be.

For example, if a tile could be two different Sword positions (two patterns each), a Present (one pattern), or Empty (three pattern) we could represent this as a list of numbers: 2,2,1,3. We then get the standard deviation (population), giving ~0.707 (lower is better). If we had another pattern which was 2,2,2,2 (note the same number of patterns total, just distributed better) that would give a sdev of 0.

The case of 2,2,2,2 is better because in every case there will always be just one move to reach a board state where there is a single pattern, while with 2,2,1,3 it is possible to get lucky (1) but also possible to be unlucky (3).

This is pretty simplistic (it doesn't look more than one step, so it is possible that [3] would actually lead to 1,1,1, which would actually make the second option better). In practice though, it performs exactly the same to the recursive solve except for a single edge case where, if there is a particular pattern and a fox is present on a particular square, the recursive solver would solve one step sooner.

## Others

The other solvers are just various other experiments.
