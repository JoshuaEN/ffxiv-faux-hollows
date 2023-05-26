<script setup lang="ts">
import { computed, ref, shallowReactive } from "vue";
import { Board } from "../game/board.js";
import {
  CombinedTileState,
  TileState,
  SolveStep,
} from "../game/types/index.js";
import GameTile from "./game-tile.vue";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  arrow,
} from "@floating-ui/vue";
import BaseTile from "./base-tile.vue";

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
  const states = [
    TileState.Unknown,
    TileState.Empty,
    TileState.Blocked,
    TileState.Sword,
    TileState.Present,
    TileState.Fox,
  ];
  const primaryOptions: TileState[] = [];
  if (
    typeof tileState === "string" &&
    tileState in TileState &&
    tileState !== TileState.Unknown
  ) {
    if (tileState === TileState.Empty) {
      primaryOptions.push(TileState.Unknown);
    } else {
      primaryOptions.push(TileState.Empty);
    }
  } else {
    switch (data.board.solveState.solveStep) {
      case SolveStep.FillBlocked: {
        primaryOptions.push(TileState.Blocked);
        break;
      }
      case SolveStep.FillSword:
      case SolveStep.FillPresent:
      case SolveStep.SuggestTiles: {
        const suggestions = data.board.solveState.getSuggestion(index);
        primaryOptions.push(TileState.Empty);
        for (const state of [TileState.Sword, TileState.Present] as const) {
          if ((suggestions?.[state] ?? 0) > 0) {
            primaryOptions.push(state);
          }
        }
        break;
      }
      case SolveStep.Done:
      default: {
        primaryOptions.push(TileState.Empty);
        break;
      }
    }
  }

  const secondaryOptions: TileState[] = [];
  const userState = data.board.getUserState(index);
  for (const state of states) {
    if (userState !== state && !primaryOptions.includes(state)) {
      secondaryOptions.push(state);
    }
  }
  popoverData.value = { index, primaryOptions, secondaryOptions };
  popoverRef.value?.focus();
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
      :ref="(el) => (popoverAnchorRefs[index] = el as any)"
      :key="index"
      class="tile"
      :class="{ focused: popoverOpen && index === popoverData?.index }"
      :tile="tile"
      :data-testid="`game-tile-index-${index}`"
      :data-test-tile="tile"
      @mousedown="(ev: MouseEvent) => tileClicked(ev, tile, index)"
    />
  </main>
  <div
    v-if="popoverOpen && popoverData"
    :ref="(el) => { popoverRef = el as HTMLDivElement | null; }"
    class="overlay"
    data-testid="popover-picker"
    :class="[popoverPlacement]"
    :style="{
      position: popoverStrategy,
      top: `${popoverY ?? 0}px`,
      left: `${popoverX ?? 0}px`,
    }"
    tabindex="-1"
    @focusout="$event => !($event.currentTarget as HTMLElement)?.contains($event.relatedTarget as Node) ? popoverData = null : false"
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
  <main class="debug">
    <div v-for="(tile, index) in data.board.tiles" :key="index">
      <template v-if="tile === TileState.Blocked">X</template>
      <template
        v-if="data.board.solveState?.getSuggestion(index)?.Blocked ?? 0 > 0"
        >B:{{ data.board.solveState?.getSuggestion(index)?.Blocked }}&nbsp;
      </template>
      <template
        v-if="data.board.solveState?.getSuggestion(index)?.Present ?? 0 > 0"
        >P:{{ data.board.solveState?.getSuggestion(index)?.Present }}&nbsp;
      </template>
      <template
        v-if="data.board.solveState?.getSuggestion(index)?.Sword ?? 0 > 0"
        >S:{{ data.board.solveState?.getSuggestion(index)?.Sword }}&nbsp;
      </template>
      <template v-if="data.board.solveState?.getSuggestion(index)?.Fox ?? 0 > 0"
        >F:{{ data.board.solveState?.getSuggestion(index)?.Fox }}&nbsp;
      </template>
      <br />
      {{ data.board.solveState?.getSuggestion(index)?.FinalWeight }}
      <br />
      {{
        data.board.solveState?.getPeakSuggestions().FinalWeight ===
        data.board.solveState?.getSuggestion(index)?.FinalWeight
          ? "*"
          : ""
      }}
    </div>
  </main>
</template>

<style scoped lang="scss" src="./game-board.scss"></style>
