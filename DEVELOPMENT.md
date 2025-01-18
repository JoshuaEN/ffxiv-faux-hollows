## Commands

- `pnpm run dev` - Starts dev server
- `pnpm run lint` - Run linting
- `pnpm run test` - Run tests for development
- `pnpm run test:ci` - Run tests once
- `pnpm run e2e:ui` - Run the e2e UI
- `pnpm run e2e` - Run the e2e tests (headless)

### Solver commands

- `pnpm run script:full-solve --solver=community-recursive-fast --skip-existing-solves=true` - Runs a specific solver, skipping any result file sets which exist (the results are not the output in [docs/solve-methods](./docs/solve-methods/), but rather intermediary data files under [solve-results](./solve-results/)). Setting `skip-existing-solves` to false will regenerate these intermediary data files.
- `pnpm run script:full-solve:all --skip-existing-solves=true` - Runs all solvers
- `pnpm run script:full-solve-e2e --identifier=[ABCD][udlr] --group-name=2025-01-03 --operation=run --skip-existing-solves=true` - Same as full solve for in-use solver, except run with Playwright instead of a directly interfacing with the Board class and only does a single identifier (to allow for parallelism). If there are no existing solves, or skip is disabled, it will take many (~12) hours for a single identifier.
- `pnpm run script:full-solve-e2e --group-name=2025-01-03 --operation=generate-summaries --skip-existing-solves=true` - Generates summaries from the results in the group.
- `pnpm run script:create-recursive-fast-lookups` - Creates the fast lookup data used by the recursive-fast solver.

### Community data loading commands

- `pnpm script:load-community-data` - See [scripts/load-community-data/README.md](./scripts/load-community-data/README.md)

## Environment Setup

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

### Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.
