<script setup lang="ts">
import { SolveStep } from "../game/types/solve-state.js";
import SolveStepComp from "./solve-step.vue";
import GameTile from "./game-tile.vue";
import ActiveHelp from "./building-blocks/active-help.vue";

import activeHelpFillBlockedEmptyBoard from "~/assets/active-help/FillBlocked/empty-board.webp";
import activeHelpFillBlockedEmptyBoardMetadata from "~/assets/active-help/FillBlocked/empty-board.webp?metadata";

import activeHelpFillSwordBoardWithSword from "~/assets/active-help/FillSword/BoardWithSword.webp";
import activeHelpFillSwordBoardWithSwordMetadata from "~/assets/active-help/FillSword/BoardWithSword.webp?metadata";
import activeHelpFillSwordToolBoardWithSword from "~/assets/active-help/FillSword/ToolBoardWithSword.webp";
import activeHelpFillSwordToolBoardWithSwordMetadata from "~/assets/active-help/FillSword/ToolBoardWithSword.webp?metadata";
import activeHelpFillSwordToolBoardWithSwordSeek from "~/assets/active-help/FillSword/ToolBoardWithSwordSeek.webp";
import activeHelpFillSwordToolBoardWithSwordSeekMetadata from "~/assets/active-help/FillSword/ToolBoardWithSwordSeek.webp?metadata";

import activeHelpFillPresentBoardWithPresent from "~/assets/active-help/FillPresent/BoardWithPresent.webp";
import activeHelpFillPresentBoardWithPresentMetadata from "~/assets/active-help/FillPresent/BoardWithPresent.webp?metadata";
import activeHelpFillPresentToolBoardWithPresent from "~/assets/active-help/FillPresent/ToolBoardWithPresent.webp";
import activeHelpFillPresentToolBoardWithPresentMetadata from "~/assets/active-help/FillPresent/ToolBoardWithPresent.webp?metadata";
import activeHelpFillPresentToolBoardWithPresentSeek from "~/assets/active-help/FillPresent/ToolBoardWithPresentSeek.webp";
import activeHelpFillPresentToolBoardWithPresentSeekMetadata from "~/assets/active-help/FillPresent/ToolBoardWithPresentSeek.webp?metadata";

import activeHelpSuggestionsSuggestionsAndFoxes from "~/assets/active-help/Suggestions/SuggestionsAndFoxes.webp";
import activeHelpSuggestionsSuggestionsAndFoxesMetadata from "~/assets/active-help/Suggestions/SuggestionsAndFoxes.webp?metadata";

import swordIcon from "~/assets/InGame/Swords.webp";
import swordIconMetadata from "~/assets/InGame/Swords.webp?metadata";
import swordIconVert from "~/assets/InGame/SwordsVert.webp";
import swordIconVertMetadata from "~/assets/InGame/SwordsVert.webp?metadata";

import presentIcon from "~/assets/InGame/GiftBoxes.webp";
import presentIconMetadata from "~/assets/InGame/GiftBoxes.webp?metadata";
import cofferIcon from "~/assets/InGame/Coffers.webp";
import cofferIconMetadata from "~/assets/InGame/Coffers.webp?metadata";

import TileSideBySide from "./tile-side-by-side.vue";
import { ref } from "vue";
import { SuggestTileState, TileState } from "../game/types/tile-states.js";

defineProps<{
  solveStep: SolveStep;
}>();
const activeHelpOpen = ref<boolean>(false);
const strategyHelpOpen = ref<boolean>(false);
</script>

<template>
  <SolveStepComp
    v-if="solveStep === SolveStep.FillBlocked"
    v-model:active-help-open="activeHelpOpen"
    active-help-title="Fill Blocked Tiles"
  >
    <em>In this tool</em>, please fill in the blocked tiles.
    <template #active-help>
      <p>
        <img
          :src="activeHelpFillBlockedEmptyBoard"
          :height="activeHelpFillBlockedEmptyBoardMetadata.height"
          :width="activeHelpFillBlockedEmptyBoardMetadata.width"
          alt="Example of the initial state of the in-game board showing both unknown and blocked tiles."
          class="float-right in-game-tile-example"
        />
        The Faux Hollows board in game will be a grid of six by six tiles which
        looks similar to the board on the right.
      </p>
      <p>Initially, the in game board will consist of two types of tiles:</p>
      <p>Unknown tiles which look like</p>
      <TileSideBySide :tile="TileState.Unknown" />
      <p>and Blocked tiles which look like</p>
      <TileSideBySide :tile="TileState.Blocked" />
      <p>
        The first step in using this tool is to fill in the Blocked tiles as
        they appear in game.
      </p>
      <p>
        Tip: To fill in a tile <em>in this tool</em>, click or tap on the tile
        and then click or tap on the desired tile state.
      </p>
      <p>
        Tip: Once enough Blocked tiles are filled in (to be a unique pattern of
        blocked tiles), the remaining Blocked tiles will automatically be filled
        in. These automatically filled in tiles are denoted with a dashed border
        around the tile.
      </p>
    </template>
  </SolveStepComp>
  <SolveStepComp
    v-else-if="solveStep === SolveStep.FillSword"
    v-model:active-help-open="activeHelpOpen"
    active-help-title="Fill Sword Tiles"
  >
    <em>In this tool</em>, please fill in the remaining Sword tiles.
    <template #active-help>
      <p>
        <img
          :src="activeHelpFillSwordBoardWithSword"
          :height="activeHelpFillSwordBoardWithSwordMetadata.height"
          :width="activeHelpFillSwordBoardWithSwordMetadata.width"
          alt="Example of a single in-game Sword tile surrounded by unknown tiles."
          class="float-right in-game-tile-example"
        />
        After uncovering a single Sword tile on the board, the remaining tiles
        can be determined since every tile is unique.
      </p>
      <p>In the case of swords, they can appear in two orientations:</p>
      <div class="figure-set">
        <figure>
          <img
            :src="swordIconVert"
            :height="swordIconVertMetadata.height"
            :width="swordIconVertMetadata.width"
            alt="Example of in-game Sword tiles in the vertical configuration (2 wide by 3 high)"
            class="in-game-tile-example"
          />
          <figcaption>2x3 Swords</figcaption>
        </figure>
        <figure>
          <img
            :src="swordIcon"
            :height="swordIconMetadata.height"
            :width="swordIconMetadata.width"
            alt="Example of in-game Sword tiles in the horizontal configuration (3 wide by 2 high)"
            class="in-game-tile-example"
          />
          <figcaption>3x2 Swords</figcaption>
        </figure>
      </div>
      <p>
        So, in the example board we can see this matches the Bottom-Middle tile
        of the 3x2 Swords.
      </p>
      <p>
        <img
          :src="activeHelpFillSwordToolBoardWithSword"
          :height="activeHelpFillSwordToolBoardWithSwordMetadata.height"
          :width="activeHelpFillSwordToolBoardWithSwordMetadata.width"
          alt="Example of this tool with the information from the previous in-game example entered."
          class="float-right in-this-tool-tile-example"
        />
        With this information, we can deduce the location of the entire Sword
        and <em>in this tool</em> fill in the remaining Sword tiles.
      </p>
      <p class="clear-float">
        Tip: This tool can automatically fill in some tiles once the overall
        shape of the Sword is entered. In the above example, only the Top-Left
        and Bottom-Right were filled into this tool, with the remaining tiles
        being automatically filled in. These automatically filled in tiles are
        denoted with a dashed border around the tile.
      </p>
      <p>
        <img
          :src="activeHelpFillSwordToolBoardWithSwordSeek"
          :height="activeHelpFillSwordToolBoardWithSwordSeekMetadata.height"
          :width="activeHelpFillSwordToolBoardWithSwordSeekMetadata.width"
          class="float-right in-this-tool-tile-example"
          alt="Example of this tool with only a single Sword tile filled in, showing the other tiles which could be a Sword with a question mark over the Sword."
        />
        Tip: This tool will display all candidate tiles as a Sword with a
        question mark, like so:
      </p>
    </template>
  </SolveStepComp>
  <SolveStepComp
    v-else-if="solveStep === SolveStep.FillPresent"
    v-model:active-help-open="activeHelpOpen"
    active-help-title="Fill Gift Box or Coffer Tiles"
  >
    <em>In this tool</em>, please fill in the remaining Gift Box / Coffer tiles.
    <template #active-help>
      <p>
        <img
          :src="activeHelpFillPresentBoardWithPresent"
          :height="activeHelpFillPresentBoardWithPresentMetadata.height"
          :width="activeHelpFillPresentBoardWithPresentMetadata.width"
          alt="Example of a single in-game Gift Box tile surrounded by unknown tiles."
          class="float-right in-game-tile-example"
        />
        After uncovering a single Gift Box (or Coffer) tile on the board, the
        remaining tiles can be determined since every tile is unique.
      </p>
      <div class="figure-set">
        <figure>
          <img
            :src="presentIcon"
            :height="presentIconMetadata.height"
            :width="presentIconMetadata.width"
            alt="Example of in-game Present tiles"
            class="in-game-tile-example"
          />
          <figcaption>Gift Box</figcaption>
        </figure>
        <figure>
          <img
            :src="cofferIcon"
            :height="cofferIconMetadata.height"
            :width="cofferIconMetadata.width"
            alt="Example of in-game Coffer tiles"
            class="in-game-tile-example"
          />
          <figcaption>Coffer</figcaption>
        </figure>
      </div>
      <p>
        So, in the example board we can see this matches the Top-Left tile of
        the Gift Box.
      </p>
      <p>
        <img
          :src="activeHelpFillPresentToolBoardWithPresent"
          :height="activeHelpFillPresentToolBoardWithPresentMetadata.height"
          :width="activeHelpFillPresentToolBoardWithPresentMetadata.width"
          alt="Example of this tool with the information from the previous in-game example entered."
          class="float-right in-this-tool-tile-example"
        />
        With this information, we can deduce the location of the entire Gift Box
        and <em>in this tool</em> fill in the remaining Gift Box tiles.
      </p>
      <p class="clear-float">
        Tip: This tool can automatically fill in some tiles once the overall
        shape of the Gift is entered. In the above example, only the Top-Left
        and Bottom-Right were filled into this tool, with the remaining tiles
        being automatically filled in. These automatically filled in tiles are
        denoted with a dashed border around the tile.
      </p>
      <p>
        <img
          :src="activeHelpFillPresentToolBoardWithPresentSeek"
          :height="activeHelpFillPresentToolBoardWithPresentSeekMetadata.height"
          :width="activeHelpFillPresentToolBoardWithPresentSeekMetadata.width"
          class="float-right in-this-tool-tile-example"
          alt="Example of this tool with only a single Gift Box tile filled in, showing the other tiles which could be a Sword with a question mark over the Sword."
        />
        Tip: This tool will display all candidate tiles as a Gift Box with a
        question mark, like so:
      </p>
    </template>
  </SolveStepComp>
  <SolveStepComp
    v-else-if="solveStep === SolveStep.SuggestTiles"
    v-model:active-help-open="activeHelpOpen"
    active-help-title="Tile Suggestions"
  >
    Uncover <strong>one of</strong> the suggested tiles <em>in game</em> and
    then fill in the result <em>in this tool</em>.
    <template #active-help>
      <p>
        When appropriate, one or more suggestions will be marked with the
        targeting crosshair:
      </p>
      <figure>
        <span class="in-this-tool-tile-example"
          ><GameTile :tile="[]" disabled></GameTile
        ></span>
        <figcaption>(in this tool)</figcaption>
      </figure>
      <p>
        The goal of these suggestions is mark tile(s) which offer the best odds
        of solving the board in the fewest moves.
      </p>
      <p>
        This is ultimately a heuristic-based approach and no guarantees are
        made.
      </p>
      <p>
        <img
          :src="activeHelpSuggestionsSuggestionsAndFoxes"
          :height="activeHelpSuggestionsSuggestionsAndFoxesMetadata.height"
          :width="activeHelpSuggestionsSuggestionsAndFoxesMetadata.width"
          alt="Example of fox spots being shown along with suggestions in this tool."
          class="float-right in-this-tool-tile-example"
        />
        Tip: If there are four or less candidate fox locations, they will be
        marked along with the tile suggestions.
      </p>
      <figure>
        <span class="in-this-tool-tile-example">
          <GameTile :tile="SuggestTileState.SuggestFox" disabled />
        </span>
        <figcaption>(in this tool)</figcaption>
      </figure>
      <p class="clear-float">
        Question: When to switch to uncovering fox locations instead of
        following this tool's suggestions?
      </p>
      <p>
        Answer: It depends on your chosen strategy. Please see the "Faux Hollows
        Strategy" help article (below) for more information.
      </p>
    </template>
  </SolveStepComp>
  <SolveStepComp
    v-else-if="
      solveStep === SolveStep.SuggestFoxes || solveStep === SolveStep.Done
    "
    v-model:active-help-open="activeHelpOpen"
    active-help-title="Board Solved"
  >
    Board solved. Uncover tiles <em>in game</em> based on your chosen strategy.
    <template #active-help>
      <p>
        The board has been solved (the Sword and Gift Box/Coffer have been
        located, and the Fox has either been found or the candidate fox
        locations have been identified).
      </p>
      <p>
        For a possible strategy, see the "Faux Hollows Strategy" help article
        (below).
      </p>
      <p>
        Tip: If the fox has not been located, possible fox locations will be
        marked as:
      </p>
      <figure>
        <span class="in-this-tool-tile-example">
          <GameTile :tile="SuggestTileState.SuggestFox" disabled />
        </span>
        <figcaption>(in this tool)</figcaption>
      </figure>
    </template>
  </SolveStepComp>
  <ActiveHelp
    v-if="
      solveStep === SolveStep.SuggestTiles ||
      solveStep === SolveStep.SuggestFoxes ||
      solveStep === SolveStep.Done
    "
    v-model:active-help-open="strategyHelpOpen"
    data-testid="strategy-active-help"
    :title="'Faux Hollows Strategy'"
  >
    <template #active-help>
      <p>
        There is no definitive strategy for Faux Hollows. This presents one
        possible strategy.
      </p>
      <h4>Telling</h4>
      <p>
        If this is the character's first faux hollows game after the weekly
        reset cycle (the "telling"), the first priority is fully uncovering the
        Swords because the they provide a retelling (which allows playing a 2nd
        time within the reset cycle).
      </p>
      <p>After the Swords are fully uncovered, it depends.</p>
      <p>
        There is no definitive percent chance of how often the fox appears so it
        is not possible to propose an optimal solution.
      </p>
      <p>
        If it is possible to fully uncover the Gift Box/Coffer, it is a choice
        between a chance at 100 Faux Leaves or the guaranteed 25 or 35 Faux
        Leaves.
      </p>
      <p>
        If it is not possible to get the Gift Box/Coffer, fox candidates
        locations should be uncovered instead.
      </p>
      <h4>Retelling</h4>
      <p>
        Because the Swords have a very low value for the 5 to 6 additional moves
        they cost to fully uncover, a common strategy is to aim to uncover the
        the Gift Box/Coffer and all of the fox candidates on the retelling
        (which is always possible when following this solver's suggestions).
      </p>
    </template>
  </ActiveHelp>
</template>

<style scoped>
img {
  border: 2px solid #00000054;
  border-radius: 10px;
  max-width: max-content;
  max-height: max-content;
}
img.float-right {
  float: right;
  width: 50%;
  height: auto;
  margin-left: 1rem;
  margin-bottom: 1rem;
}
.clear-float {
  clear: both;
}
.figure-set {
  display: inline flex;
  gap: 1rem;
  flex-direction: row;
  justify-content: space-around;
  justify-items: end;
  flex-wrap: nowrap;
  align-items: flex-end;
}
</style>
