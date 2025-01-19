# Commands

- `pnpm run dev` - Starts dev server
- `pnpm run typecheck` - Run typechecking
- `pnpm run lint` - Run linting
- `pnpm run test` - Run tests for development
- `pnpm run test:ci` - Run tests once
- `pnpm run e2e:ui` - Run the e2e UI
- `pnpm run e2e` - Run the e2e tests (headless)

## Solver commands

- `pnpm run script:full-solve --solver=community-recursive-fast --skip-existing-solves=true` - Runs a specific solver, skipping any result file sets which exist (the results are not the output in [docs/solve-methods](./docs/solve-methods/), but rather intermediary data files under [solve-results](./solve-results/)). Setting `skip-existing-solves` to false will regenerate these intermediary data files.
- `pnpm run script:full-solve:all --skip-existing-solves=true` - Runs all solvers

- `pnpm run script:full-solve-e2e --identifier=[ABCD][udlr] --group-name=2025-01-03 --operation=run --skip-existing-solves=true` - Same as full solve for in-use solver, except run with Playwright instead of a directly interfacing with the Board class and only does a single identifier (to allow for parallelism). If there are no existing solves, or skip is disabled, it will take many (~12) hours for a single identifier.
- `pnpm run script:full-solve-e2e --group-name=2025-01-03 --operation=generate-summaries --skip-existing-solves=true` - Generates summaries from the results in the group.

- `pnpm run script:create-recursive-fast-lookups` - Creates the fast lookup data used by the recursive-fast solver.

## Community data loading commands

- `pnpm script:load-community-data` - See [scripts/load-community-data/README.md](./scripts/load-community-data/README.md)

# Testing strategy

## e2e tests

e2e tests are widely used to provide both e2e and component/integration level testing. This is perhaps not optimal, but the small size of the project makes this work well and sidesteps needing to setup a component testing test framework.

## Unit tests

There are a few unit tests, as most code is in components, and thus covered by the e2e tests, or part of the main solver flow and covered by the domain specific tests.

## All possible pattern tests

Using the fact all possible valid patterns are known, the solver is run through every possible combination of recommended moves (including every fox location for each pattern, including no fox being present), repeated for each common strategy:

1. Try to uncover Sword + Present
1. Try to uncover Sword + Fox
1. Try to uncover Present + Fox
1. Try to uncover just the Fox (used for some metrics, not a real strategy)
1. Try to uncover everything

The raw results of these moves is stored in a set of files, and then aggregated together into a single output file which is checked in.

This allows validating the expected behavior across all possible patterns (or at least that no errors occur) and complete regression testing of expected states.

This can be run both in node and with playwright in a real browser. The latter is exceedingly slow.

Additional information is available in [docs/solve-methods/README.md](./docs/solve-methods/README.md).

## Shared tests

There are a suite of tests written in a domain specific language (DSL) and run against multiple entry points.

### DSL

Example:

```text
ID C
## 0
┌─────┬─────┬─────┬─────┬─────┬─────┐
│     │     │     │     │ B   │     │
├─────┼─────┼─────┼─────┼─────┼─────┤
│     │ B   │     │ E   │ E   │     │
├─────┼─────┼─────┼─────┼─────┼─────┤
│ P   │ P   │     │ B   │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┤
│ P   │ P   │     │ S   │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┤
│     │ B   │>S1! │     │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │     │ B   │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┘
[Error] The tiles entered do not match any patterns. Please ensure the tiles entered onto the board are correct. # Issues: 21, 26, 12, 13, 18, 19, 9, 10
```

This overall represents two things:

1. (Optionally) One or more user inputs to perform (`>` command in a cell)
1. The state of the board (often the expected state), including the board pattern identifier (ID), number of possible patterns remaining (##), the board, and any errors.

Note the state of the board represented is _after_ the user inputs have been performed.

Each cell represents a board cell.

Tile states are represented as the first character of the state:

- B -> Blocked tile
- E -> Empty tile
- S -> Sword tile
- P -> Present tile
- F -> Fox tile

Upper case indicates the user entered the state, lower case indicates the state was "smart-filled" or (in some contexts) suggested. In the table below these will be represented as `T` (any tile state entered by the user) and `t` (any tile state "smart-filled").

In the table below, you will also see `#t` (where `t` will actually be a specific tile state). This indicates there are `#` number of patterns with a `t` tile on the given cell.

| Directive                       | Meaning               | Arg 1               | Arg 2               | Arg 3               | Arg 4               | Example In                             | Example Meaning                                                                                                                |
| ------------------------------- | --------------------- | ------------------- | ------------------- | ------------------- | ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| <code>&nbsp;</code> (Arg 1 set) | User entered tile     | `T`                 | <code>&nbsp;</code> | <code>&nbsp;</code> | <code>&nbsp;</code> | <code>&nbsp;S&nbsp;&nbsp;&nbsp;</code> | Sword entered by a user                                                                                                        |
| <code>&nbsp;</code> (Arg 2 set) | Smart filled tile     | <code>&nbsp;</code> | `t`                 | <code>&nbsp;</code> | <code>&nbsp;</code> | <code>&nbsp;&nbsp;s&nbsp;&nbsp;</code> | Sword smart filled                                                                                                             |
| `*`                             | Suggested tile        | `#s`                | `#p`                | `#f`                | <code>&nbsp;</code> | <code>\*432&nbsp;</code>               | Tile is suggested; for the current remaining patterns, in 4 it has a Sword, in 3 it has a present, and in 2 it may have a Fox. |
| `.` (Arg 4 set)                 | Suggested fill tile   | `#s`                | `#p`                | `#f`                | `s` or `p`          | `*432p`                                | Tile is suggested for filling shape (Sword or Present); the count indicators are the same as above                             |
| `.` (Arg 4 blank)               | Possible tile states  | `#s`                | `#p`                | `#f`                | <code>&nbsp;</code> | <code>\*432&nbsp;</code>               | Tile is not suggested, but still has possible states; the count indicators are the same as above                               |
| `?`                             | Suggest fox candidate | `f`                 | <code>&nbsp;</code> | <code>&nbsp;</code> | `#f`                | <code>?f&nbsp;&nbsp;2                  | For the current remaining patterns, 2 may have a fox.                                                                          |

The main suite of tests written in this form are located in [test/data](./test/data/). This suite is then run in:

- [src/game/solver/solve-state.spec.ts](./src/game/solver/solve-state.spec.ts)
- [src/game/solver/solver.spec.ts](./src/game/solver/solver.spec.ts)
- [e2e/common-tests.spec.ts](./e2e/common-tests.spec.ts)

These tests are automatically run as part of vitest and playwright.

Additionally, some of the standalone e2e tests also use this DSL inline.

# Environment setup

## Recommended IDE setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type support for `.vue` imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.
