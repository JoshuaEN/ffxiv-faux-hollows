<script setup lang="ts">
import {
  CombinedTileState,
  SmartFillTileState,
  SuggestTileState,
  TileState,
} from "../game/types/index.js";
import BaseTile from "./base-tile.vue";

defineProps<{ tile: CombinedTileState; index?: number; disabled?: boolean }>();
</script>

<template>
  <BaseTile
    :tile="tile"
    :index="index"
    :disabled="disabled"
    :class="{
      smartFill:
        tile === SmartFillTileState.SmartFillBlocked ||
        tile === SmartFillTileState.SmartFillSword ||
        tile === SmartFillTileState.SmartFillPresent,
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
  opacity: 0.75;
}
.smartFill {
  opacity: 0.95;
  border: var(--tile-border-smart-fill-width) dashed var(--tile-color);
}
.userInput {
  border: var(--tile-border-default-width) solid var(--tile-color);
}
.nextTarget {
  color: var(--board-next-target-color);
  background-color: var(--board-next-target-background-color);
  border: var(--tile-border-default-width) dotted
    var(--board-next-target-outline-color);
}
</style>
