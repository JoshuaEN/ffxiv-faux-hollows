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
    <svg
      v-if="
        tile === TileState.Blocked ||
        tile === SmartFillTileState.SmartFillBlocked
      "
      viewBox="3 3 18 18"
    >
      <!-- Custom icon -->
      <ellipse fill="currentColor" cx="6" cy="6" rx="1" ry="1" />
      <ellipse fill="currentColor" cx="6" cy="18" rx="1" ry="1" />
      <ellipse fill="currentColor" cx="18" cy="18" rx="1" ry="1" />
      <ellipse fill="currentColor" cx="18" cy="6" rx="1" ry="1" />
    </svg>
    <svg
      v-else-if="
        tile === TileState.Sword ||
        tile === SmartFillTileState.SmartFillSword ||
        tile === SuggestTileState.SuggestSword
      "
      viewBox="0 0 24 24"
    >
      <!-- Material Design Icons: sword-cross -->
      <path
        fill="currentColor"
        d="M6.2,2.44L18.1,14.34L20.22,12.22L21.63,13.63L19.16,16.1L22.34,19.28C22.73,19.67 22.73,20.3 22.34,20.69L21.63,21.4C21.24,21.79 20.61,21.79 20.22,21.4L17,18.23L14.56,20.7L13.15,19.29L15.27,17.17L3.37,5.27V2.44H6.2M15.89,10L20.63,5.26V2.44H17.8L13.06,7.18L15.89,10M10.94,15L8.11,12.13L5.9,14.34L3.78,12.22L2.37,13.63L4.84,16.1L1.66,19.29C1.27,19.68 1.27,20.31 1.66,20.7L2.37,21.41C2.76,21.8 3.39,21.8 3.78,21.41L7,18.23L9.44,20.7L10.85,19.29L8.73,17.17L10.94,15Z"
      />
    </svg>
    <svg
      v-else-if="
        tile === TileState.Present ||
        tile === SmartFillTileState.SmartFillPresent ||
        tile === SuggestTileState.SuggestPresent
      "
      viewBox="0 0 24 24"
    >
      <!-- Material Design Icons: gift-outline -->
      <path
        fill="currentColor"
        d="M22,12V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V12A1,1 0 0,1 1,11V8A2,2 0 0,1 3,6H6.17C6.06,5.69 6,5.35 6,5A3,3 0 0,1 9,2C10,2 10.88,2.5 11.43,3.24V3.23L12,4L12.57,3.23V3.24C13.12,2.5 14,2 15,2A3,3 0 0,1 18,5C18,5.35 17.94,5.69 17.83,6H21A2,2 0 0,1 23,8V11A1,1 0 0,1 22,12M4,20H11V12H4V20M20,20V12H13V20H20M9,4A1,1 0 0,0 8,5A1,1 0 0,0 9,6A1,1 0 0,0 10,5A1,1 0 0,0 9,4M15,4A1,1 0 0,0 14,5A1,1 0 0,0 15,6A1,1 0 0,0 16,5A1,1 0 0,0 15,4M3,8V10H11V8H3M13,8V10H21V8H13Z"
      />
    </svg>
    <svg
      v-else-if="tile === TileState.Fox || tile === SuggestTileState.SuggestFox"
      viewBox="-2 -2 23.2 24"
    >
      <!-- Custom (traced from official FFXIV art)-->
      <path
        fill="currentColor"
        d="M17.881,7.161C19.344,4.388,17.379,0,17.379,0s-2.686,1.484-3.887,3.034c-3.864-2.14-7.123-0.186-7.685,0.088
		C3.711,0.567,1.658,0,1.658,0S0.021,4.978,1.396,7.161c-0.633,1.311-1.877,3.646-1.201,6.484c2.336-1.135,2.425-0.917,3.472-0.96
		c1.332-0.022,2.616,0.32,2.882,1.375c0.266,1.056,1.463,2.686,3.101,2.686c1.681,0.005,2.423-1.07,3.013-2.598
		c0.559-1.449,2.86-1.461,3.122-1.441c1.157,0.087,2.555,0.393,3.275,0.742C19.824,9.454,18.162,7.564,17.881,7.161z M2.227,4.585
		c0,0-0.208-2.146,0.196-2.424c0.321-0.22,2.302,1.18,1.747,1.18C3.1,3.341,2.227,4.585,2.227,4.585z M6.877,8.472h-2.97
		c-0.844,0-0.844-1.311,0-1.311h2.97C7.722,7.161,7.722,8.472,6.877,8.472z M10.16,15.174l-1.032-0.006
		c-0.502-0.356-0.524-0.654-0.524-0.654c-0.003-0.026-0.019-0.189-0.005-0.248C8.63,14.125,8.748,13.924,9,13.873l1.292-0.001
		c0.182,0.01,0.337,0.218,0.39,0.388c0.015,0.047,0.008,0.213,0.008,0.248C10.689,14.508,10.644,14.978,10.16,15.174z M15.458,8.493
		h-3.035c-0.845,0-0.845-1.311,0-1.311h3.035C16.303,7.183,16.303,8.493,15.458,8.493z M17.161,4.585
		c-0.263-0.327-1.441-1.244-1.966-1.419c0.152-0.328,1.42-1.157,1.747-1.026S17.139,3.864,17.161,4.585z"
      />
      <path
        fill="currentColor"
        d="M15.613,13.188c-2.25-0.088-2.6,1.899-2.6,1.899s-1.004,2.358-3.382,2.292
	c-2.469,0.088-3.342-2.664-3.342-2.664s-0.474-1.592-2.555-1.527s-3.319,1.156-3.319,1.156S1.354,19.847,9.63,20
	c7.882-0.197,9.214-5.656,9.214-5.656S17.381,13.209,15.613,13.188z M2.321,15.162c-0.253-0.004-0.253-0.396,0-0.393
	c0.444,0.006,0.897-0.008,1.33-0.118C3.896,14.589,4,14.968,3.755,15.03C3.289,15.15,2.8,15.17,2.321,15.162z M4.696,15.955
	c-0.492,0.095-0.969,0.117-1.468,0.129c-0.254,0.006-0.253-0.388,0-0.394c0.464-0.011,0.905-0.026,1.364-0.114
	C4.84,15.529,4.945,15.908,4.696,15.955z M16,16.09c-0.508,0.004-1.009-0.035-1.507-0.145c-0.248-0.054-0.143-0.433,0.104-0.379
	c0.465,0.102,0.929,0.134,1.402,0.131C16.254,15.695,16.254,16.088,16,16.09z M16.893,15.173c-0.447,0.001-0.943,0.018-1.376-0.118
	c-0.241-0.075-0.138-0.455,0.104-0.379c0.4,0.125,0.857,0.105,1.271,0.104C17.146,14.779,17.146,15.172,16.893,15.173z"
      />
    </svg>
    <!-- Material Design Icons: target-variant -->
    <svg
      v-else-if="Array.isArray(tile)"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        d="M22.08,11.04H20.08V4H13.05V2H11.04V4H4V11.04H2V13.05H4V20.08H11.04V22.08H13.05V20.08H20.08V13.05H22.08V11.04M18.07,18.07H13.05V16.06H11.04V18.07H6V13.05H8.03V11.04H6V6H11.04V8.03H13.05V6H18.07V11.04H16.06V13.05H18.07V18.07M13.05,12.05A1,1 0 0,1 12.05,13.05C11.5,13.05 11.04,12.6 11.04,12.05C11.04,11.5 11.5,11.04 12.05,11.04C12.6,11.04 13.05,11.5 13.05,12.05Z"
      />
    </svg>
    <!-- Material Design Icons: cancel -->
    <svg
      v-else-if="tile === TileState.Empty"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V5H19V19M17,8.4L13.4,12L17,15.6L15.6,17L12,13.4L8.4,17L7,15.6L10.6,12L7,8.4L8.4,7L12,10.6L15.6,7L17,8.4Z"
      />
    </svg>
    <div
      v-else-if="
        tile === TileState.Unknown || tile === SuggestTileState.SuggestFox
      "
    ></div>
    <div v-else>
      {{ Array.isArray(tile) ? "*" : tile }}
    </div>
    <svg
      v-if="
        tile === SuggestTileState.SuggestSword ||
        tile === SuggestTileState.SuggestPresent
      "
      class="suggestionIndicator"
      :class="{ [`${tile}-suggestion-indicator`]: true }"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        d="M10,19H13V22H10V19M12,2C17.35,2.22 19.68,7.62 16.5,11.67C15.67,12.67 14.33,13.33 13.67,14.17C13,15 13,16 13,17H10C10,15.33 10,13.92 10.67,12.92C11.33,11.92 12.67,11.33 13.5,10.67C15.92,8.43 15.32,5.26 12,5A3,3 0 0,0 9,8H6A6,6 0 0,1 12,2Z"
      />
    </svg>
    <svg
      v-if="tile === SuggestTileState.SuggestFox"
      class="suggestionIndicator"
      :class="{ [`${tile}-suggestion-indicator`]: true }"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        d="M10,2C17.35,2.22 19.68,7.62 16.5,11.67C15.67,12.67 14.33,13.33 13.67,14.17C13,15 13,16 13,17H10C10,15.33 10,13.92 10.67,12.92C11.33,11.92 12.67,11.33 13.5,10.67C15.92,8.43 15.32,5.26 12,5A3,3 0 0,0 9,8H6A6,6 0 0,1 12,2Z"
      />
    </svg>
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
