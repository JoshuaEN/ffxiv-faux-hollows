# Skipped tests

- [ ] All skipped tests should be fixed or removed

# Solver

- [ ] Logic conflict between Sword and Present
- [ ] If the user picks a fox, that should be cross-referenced with the candidate states to weight.

# UI

- [x] Indicator for smart-filled tiles vs. user-entered tiles
- [ ] Mobile UI pin select popup to bottom
- [ ] General keyboard support; focus trapping in the popup
- [ ] Tooltips
- [x] Empty tile icon
- [x] Show foxes
- [ ] Two column layout for widescreen monitors.
- [ ] Better display of Identifier and total candidate patterns.
- [ ] Active help article on how the solver works at a high level (maybe?)

# Problems

- [x] If smart-fill can infer _some_ tiles, but not all of them, and the user has not entered any for that type of tile, the suggestion should be on the smart fill tile(s).
  - [x] Still broken if we're in suggest mode for a different tile then we are partly smart filling
  - [x] Also need tests
- [x] Entering all fox locations as empty incorrectly eliminates candidate patterns.
