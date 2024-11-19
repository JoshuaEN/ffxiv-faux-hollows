# README

#

We need to account for the opportunity cost of flipping a tile. We currently count turning over an empty tile and, via deduction, finding the Present as the same as turning over a tile with the Present, but to a user the latter is far more desirable because we did not "waste" a turn turning over an empty tile.

Report the best/worst pattern for each blocked + sword + present + fox to eliminate noise from duplicate paths with equal value, which causes averages to be misleading.

---

Look at patterns eliminated vs. patterns kept?

We are not capturing Fox pattern overlaps, for the purpose of calculating full solve to fox. For example, C up, 2nd pattern from the bottom. If we found the Sword, the location of the present does not matter for finding the Fox positions.

---

For solving, consider unique buckets.

For example, say there are 6 patterns left. A tile which, depending on what is actually under it, splits those patterns into three buckets of two patterns each is better than a tile which splits it into two buckets of 3 each (in theory), because we are eliminating more options (always 4).

Of course, we need to consider if the two buckets of three could then each be determined in one more move, but the three buckets of two took 2 more moves (impossible, but anyway), then the two buckets of three would be better.

One approximation of this ( maybe) is to give each tile a weight value based on how many unique patterns interact with it in a meaningful way. For example, in A up, the tile 16 has S16_2x3 (2), S15_2x3 (2), F16 (4), S15_3x2 (2), S14_2x3 (2), P16 (1), blank (3). This is an extremely good tile, as the single pick leaves at most 4 options. F22 is (probably, need to check) a better option though, as it should eliminate the F16 (4) case and the blank (3) becomes blank (2).

Also, empty tiles are less desirable because they are "wasted".
