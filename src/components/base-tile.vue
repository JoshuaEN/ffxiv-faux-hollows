<script setup lang="ts">
import { computed } from "vue";
import {
  CombinedTileState,
  SmartFillTileState,
  SuggestTileState,
  TileState,
} from "../game/types/index.js";
import { assertNever } from "../helpers.js";
import { indexToCord } from "../game/helpers.js";
import { TileStateDisplayName } from "./tile.utils.js";
import SuggestFoxIcon from "./icons/suggest-fox-icon.vue";
import BlockedIcon from "./icons/blocked-icon.vue";
import SwordIcon from "./icons/sword-icon.vue";
import PresentIcon from "./icons/present-icon.vue";
import FoxIcon from "./icons/fox-icon.vue";
import TargetIcon from "./icons/target-icon.vue";
import EmptyIcon from "./icons/empty-icon.vue";
import SuggestIcon from "./icons/suggest-icon.vue";

const indexMap = ["A", "B", "C", "D", "E", "F"];

const props = defineProps<{
  tile: CombinedTileState;
  index?: number;
  disabled?: boolean;
}>();
const label = computed(() => {
  const index = props.index !== undefined ? indexToCord(props.index) : null;
  let label = "";
  if (index !== null) {
    label = `Tile ${indexMap[index.x] ?? index.x + 1}${index.y + 1} `;
    if (Array.isArray(props.tile)) {
      return `${label} Suggested to uncover`;
    }
    switch (props.tile) {
      case TileState.Sword:
        return `${label}User entered ${TileStateDisplayName[props.tile]}`;
      case TileState.Present:
        return `${label}User entered ${TileStateDisplayName[props.tile]}`;
      case TileState.Fox:
        return `${label}User entered ${TileStateDisplayName[props.tile]}`;
      case TileState.Blocked:
        return `${label}User entered ${TileStateDisplayName[props.tile]}`;
      case TileState.Empty:
        return `${label}User entered ${TileStateDisplayName[props.tile]}`;
      case TileState.Unknown:
        return `${label}${TileStateDisplayName[props.tile]}  `;
      case SmartFillTileState.SmartFillSword:
        return `${label}Automatically detected ${TileStateDisplayName[TileState.Sword]}`;
      case SmartFillTileState.SmartFillBlocked:
        return `${label}Automatically detected ${TileStateDisplayName[TileState.Blocked]}`;
      case SmartFillTileState.SmartFillPresent:
        return `${label}Automatically detected ${TileStateDisplayName[TileState.Present]}`;
      case SuggestTileState.SuggestSword:
        return `${label}Possible ${TileStateDisplayName[TileState.Sword]}`;
      case SuggestTileState.SuggestPresent:
        return `${label}Possible ${TileStateDisplayName[TileState.Present]}`;
      case SuggestTileState.SuggestFox:
        return `${label}Possible ${TileStateDisplayName[TileState.Fox]}`;
      default:
        assertNever(props.tile);
        return label;
    }
  } else {
    if (Array.isArray(props.tile)) {
      return `Suggested to uncover`;
    }
    return props.tile;
  }
});
</script>

<template>
  <button
    :class="{ [`${tile}`]: !Array.isArray(tile) }"
    :aria-label="label"
    :disabled="disabled ?? false"
  >
    <BlockedIcon
      v-if="
        tile === TileState.Blocked ||
        tile === SmartFillTileState.SmartFillBlocked
      "
    />
    <SwordIcon
      v-else-if="
        tile === TileState.Sword ||
        tile === SmartFillTileState.SmartFillSword ||
        tile === SuggestTileState.SuggestSword
      "
    />
    <PresentIcon
      v-else-if="
        tile === TileState.Present ||
        tile === SmartFillTileState.SmartFillPresent ||
        tile === SuggestTileState.SuggestPresent
      "
    />
    <FoxIcon
      v-else-if="tile === TileState.Fox || tile === SuggestTileState.SuggestFox"
    />
    <TargetIcon v-else-if="Array.isArray(tile)" />
    <EmptyIcon v-else-if="tile === TileState.Empty" />
    <div
      v-else-if="
        tile === TileState.Unknown || tile === SuggestTileState.SuggestFox
      "
    ></div>
    <div v-else>
      {{ Array.isArray(tile) ? "*" : tile }}
    </div>
    <SuggestIcon
      v-if="
        tile === SuggestTileState.SuggestSword ||
        tile === SuggestTileState.SuggestPresent
      "
      class="suggestionIndicator"
      :class="{ [`${tile}-suggestion-indicator`]: true }"
    />
    <SuggestFoxIcon
      v-if="tile === SuggestTileState.SuggestFox"
      class="suggestionIndicator"
      :class="{ [`${tile}-suggestion-indicator`]: true }"
    />
  </button>
</template>

<style scoped>
button {
  position: relative;
  display: block;
  max-height: var(--tile-max-size);
  min-height: var(--tile-min-size);
  aspect-ratio: 1;
}
svg {
  position: absolute;
}
svg:not(.suggestionIndicator) {
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
}
</style>
