# Usage

1. Open the Faux Hollows Foxes locations community data spreadsheet [here](https://docs.google.com/spreadsheets/d/1mUyCzlzDmdXMwaSTUgWXtEA45oJNn-iB4_bVM43zf58/edit#gid=49331949)
1. Go to File > Download > Web page (.html)
1. This should download a .zip file
1. Extract the .zip file to a folder somewhere
1. Run `pnpm run script:load-community-data /path/to/folder`

Ideally, at this point, the [../../src/game/generated-community-data.ts](../../src/game/generated-community-data.ts) file will have been automatically updated without issue.

The most likely source of problems is slightly different colors being used for cells; in which case, the `colors` object can be updated with additional mappings.
