<script setup lang="ts">
import { computed, ref, shallowReactive } from "vue";
import { Board } from "~/src/game/board.js";
import { CombinedTileState, TileState } from "~/src/game/types/index.js";
import GameTile from "~/src/components/game-tile.vue";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  arrow,
} from "@floating-ui/vue";
import BaseTile from "~/src/components/base-tile.vue";
import { getPickerOptions } from "./game-board.utils.js";

const popoverAnchorRef = ref(null);
const popoverAnchorRefs = ref<unknown[]>([]);
const popoverRef = ref<HTMLDivElement | null>(null);
const popoverArrowRef = ref(null);
const popoverMiddleware = ref([
  offset({ mainAxis: 10 }),
  flip(),
  shift(),
  arrow({ element: popoverArrowRef }),
]);
const {
  x: popoverX,
  y: popoverY,
  placement: popoverPlacement,
  strategy: popoverStrategy,
  middlewareData: popoverMiddlewareData,
} = useFloating(popoverAnchorRef, popoverRef, {
  placement: ref("bottom" as const),
  middleware: popoverMiddleware,
  whileElementsMounted: autoUpdate,
});

const showDebugInfo = import.meta.env.DEV;

const popoverData = ref<{
  primaryOptions: TileState[];
  secondaryOptions: TileState[];
  index: number;
} | null>(null);
const popoverOpen = computed(
  () =>
    popoverData.value !== null &&
    popoverAnchorRefs.value[popoverData.value.index] !== null
);

const props = defineProps<{ board: Board }>();
const data = shallowReactive({ board: props.board });

const hideTilePicker = () => {
  popoverData.value = null;
};

const showTilePicker = (tileState: CombinedTileState, index: number) => {
  popoverAnchorRef.value = popoverAnchorRefs.value[index] as null;
  popoverData.value = {
    index,
    ...getPickerOptions(data.board, tileState, index),
  };

  // We need to do this to prevent the @focusout event from closing this popover if this popover is replacing another popover
  popoverRef.value?.focus();
  window.requestAnimationFrame(() =>
    (popoverRef.value?.querySelector("button") as HTMLElement | null)?.focus()
  );
};

const tileClicked = (
  ev: MouseEvent,
  tile: CombinedTileState,
  index: number
) => {
  ev.preventDefault();
  ev.stopImmediatePropagation();
  if (popoverOpen.value && index === popoverData.value?.index) {
    hideTilePicker();
  } else {
    showTilePicker(tile, index);
  }
};

const pickTile = (index: number, tileState: TileState) => {
  hideTilePicker();
  props.board.setUserState(index, tileState);
  data.board = props.board;
};
</script>

<template>
  <div>Identifier: {{ data.board.solveState.getPatternIdentifier() }}</div>
  <div>
    Total candidate patterns: {{ data.board.solveState.totalCandidatePatterns }}
  </div>
  <div
    v-for="issue in data.board.issues"
    :key="issue.message"
    data-testid="board-issue"
    class="issue"
  >
    <span class="severity" data-testid="severity">[{{ issue.severity }}]</span
    >&nbsp;
    <span class="message" data-testid="message">{{ issue.message }}</span>
  </div>
  <main :class="{ focusTile: popoverOpen }" data-testid="game-board">
    <GameTile
      v-for="(tile, index) in data.board.tiles"
      :ref="(el: any) => (popoverAnchorRefs[index] = el)"
      :key="index"
      class="tile"
      :class="{ focused: popoverOpen && index === popoverData?.index }"
      :tile="tile"
      :index="index"
      :data-testid="`game-tile-index-${index}`"
      :data-test-tile="tile"
      @mousedown="(ev: MouseEvent) => tileClicked(ev, tile, index)"
    />
  </main>

  <!-- Popover -->
  <div
    v-if="popoverOpen && popoverData"
    :ref="
      (el) => {
        popoverRef = el as HTMLDivElement | null;
      }
    "
    class="overlay"
    data-testid="popover-picker"
    :class="[popoverPlacement]"
    :style="{
      position: popoverStrategy,
      top: `${popoverY ?? 0}px`,
      left: `${popoverX ?? 0}px`,
    }"
    tabindex="-1"
    @focusout="
      ($event) =>
        !($event.currentTarget as HTMLElement)?.contains(
          $event.relatedTarget as Node
        )
          ? (popoverData = null)
          : false
    "
  >
    <div
      ref="popoverArrowRef"
      class="arrow"
      :class="[popoverPlacement]"
      :style="{
        top: popoverMiddlewareData.arrow?.y
          ? `${popoverMiddlewareData.arrow?.y ?? 0}px`
          : undefined,
        left: popoverMiddlewareData.arrow?.x
          ? `${popoverMiddlewareData.arrow?.x ?? 0}px`
          : undefined,
      }"
    ></div>
    <div
      v-if="popoverData.primaryOptions"
      class="buttons"
      data-testid="popover-picker-primary-options"
    >
      <div
        v-for="option in popoverData.primaryOptions"
        :key="`${option}`"
        data-testid="popover-picker-primary-option"
      >
        <BaseTile
          :tile="option"
          :data-testid="`popover-picker-button-${option}`"
          @click="pickTile(popoverData!.index, option)"
        />
        {{ option }}
      </div>
    </div>
    <div
      v-if="popoverData.secondaryOptions"
      class="buttons"
      data-testid="popover-picker-secondary-options"
    >
      <div
        v-for="option in popoverData.secondaryOptions"
        :key="`${option}`"
        data-testid="popover-picker-secondary-option"
      >
        <BaseTile
          :tile="option"
          :data-testid="`popover-picker-button-${option}`"
          @click="pickTile(popoverData!.index, option)"
        />
        {{ option }}
      </div>
    </div>
  </div>

  <div>{{ data.board.solveState?.solveStep }}</div>
  <main v-if="showDebugInfo" class="debug">
    <div v-for="(tile, index) in data.board.tiles" :key="index">
      {{ index }} <br />
      <template
        v-if="
          tile === TileState.Blocked ||
          data.board.solveState?.getSmartFill(index) === TileState.Blocked
        "
        >X</template
      >
      <template
        v-if="data.board.solveState?.getSuggestion(index)?.Blocked ?? 0 > 0"
        >b{{ data.board.solveState?.getSuggestion(index)?.Blocked }}&nbsp;
      </template>
      <template
        v-if="data.board.solveState?.getSuggestion(index)?.Present ?? 0 > 0"
        >p{{ data.board.solveState?.getSuggestion(index)?.Present }}&nbsp;
      </template>
      <template
        v-if="data.board.solveState?.getSuggestion(index)?.Sword ?? 0 > 0"
        >s{{ data.board.solveState?.getSuggestion(index)?.Sword }}&nbsp;
      </template>
      <template v-if="data.board.solveState?.getSuggestion(index)?.Fox ?? 0 > 0"
        >f{{ data.board.solveState?.getSuggestion(index)?.Fox }}&nbsp;
      </template>
      <br />
      {{ data.board.solveState?.getFinalWeight(index)?.value ?? 0 }}
      <br />
      {{
        data.board.solveState?.getMaxTileWeight() ===
        data.board.solveState?.getFinalWeight(index)?.value
          ? "*"
          : "&nbsp;"
      }}
    </div>
  </main>
</template>

<style scoped lang="scss" src="./game-board.scss"></style>
