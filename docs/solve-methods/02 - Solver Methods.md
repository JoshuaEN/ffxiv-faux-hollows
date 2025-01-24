# Solver Methods

Solve methods, generally, refer to the approach for determining the best tile(s) to recommend the user uncover next when playing Faux Hollows.

Several solve approaches have been explored:

## Recursive Solver (Current Solver Method)

The recursive solver identifies the possible patterns based on the current board and then simulates, for every tile on the board, every possible path from choosing that tile to the point the board is solved.

The solver then assigns each tile a value of the average number of moves across all paths to solve the board. The tile(s) which have the lowest average are then recommended.

More specifically, starting from the current board state, the solver:

<ol>
  <li>Gets all possible patterns remaining.</li>
  <li>Gets all Unknown tiles which overlap with at least one remaining pattern (e.g. a fox candidate, the sword would cover that tile, etc...).</li>
  <li>For each of those tiles,<br>for each remaining pattern:
    <ol type="a">
      <li>Simulate uncovering that tile.<br>For candidate fox locations, both outcomes (fox, no fox) are simulated.</li>
      <li>If the board is not solved, start over at step 1 with this new board.</li>
      <li>Add the result from the previous step to the list of all results.</li>
    </ol>
  </li>
  <li>Average all of the results.</li>
  <li>Return this value.</li>
</ol>

That probably sounds like a _lot_ of possibilities to calculate, but the solver caches results (e.g., many paths tend to reach a point where there's only the four fox tiles left, results in these being calculated just once) and filters patterns instead of adding empty marks to the simulated board (this helps the cache hit rate).

The recursive fast version also uses a lookup table for the first step (the initial state) of all patterns, which offers a significant performance boost since the first move has far more possibilities to calculate (though the realtime performance was acceptable on high-end desktop).

This is the approach currently used.

[Source code](../../src/game/solver/modules/calculate-state-candidates/community-data-state-candidates/recursive-fast.ts)

## Buckets

The buckets solver suggests the tile(s) based on how well distributed the patterns would be.

For example, if a tile could be two different Sword positions (two patterns each), a Present (one pattern), or Empty (three pattern) we could represent this as a list of numbers: 2,2,1,3. We then get the standard deviation (population), giving ~0.707 (lower is better). If we had another pattern which was 2,2,2,2 (note the same number of patterns total, just distributed better) that would give a sdev of 0.

The case of 2,2,2,2 is better because in every case there will always be just one move to reach a board state where there is a single pattern, while with 2,2,1,3 it is possible to get lucky (1) but also possible to be unlucky (3).

This is pretty simplistic (it doesn't look more than one step, so it is possible that [3] would actually lead to 1,1,1, which would actually make the second option better). In practice though, it performs exactly the same to the recursive solve except for a single edge case where, if there is a particular pattern and a fox is present on a particular square, the recursive solver would solve one step sooner.

[Source code](../../src/game/solver/modules/calculate-state-candidates/community-data-state-candidates/buckets.ts)

## Others

The other solvers are just various other experiments and points of comparison.

[Source code](../../src/game/solver/modules/calculate-state-candidates)
