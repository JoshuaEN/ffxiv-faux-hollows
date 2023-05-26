<script setup lang="ts">
import {
  CombinedTileState,
  SmartFillTileState,
  SuggestTileState,
  TileState,
} from "../game/types/index.js";
import BaseTile from "./base-tile.vue";

defineProps<{ tile: CombinedTileState }>();
</script>

<template>
  <BaseTile
    :tile="tile"
    :class="{
      smartFill:
        tile === SmartFillTileState.Blocked ||
        tile === SmartFillTileState.Sword ||
        tile === SmartFillTileState.Present,
      suggestion:
        tile === SuggestTileState.SuggestSword ||
        tile === SuggestTileState.SuggestPresent ||
        tile === SuggestTileState.SuggestFox,
      userInput:
        tile === TileState.Blocked ||
        tile === TileState.Empty ||
        tile === TileState.Sword ||
        tile === TileState.Present ||
        tile === TileState.Fox,
      nextTarget: Array.isArray(tile),
    }"
  />
</template>

<style scoped>
.suggestion {
  opacity: 0.5;
}
.smartFill {
  opacity: 0.95;
  border: 3px dashed var(--tile-color);
}
.userInput {
  border: 2px solid white;
}
.nextTarget {
  color: #ffd700;
  background-color: var(--board-unknown-background-color);
  border: 2px dotted #ffd700;
}
</style>
