<script setup lang="ts">
import { computed, ref, shallowReactive } from "vue";
import { Board } from "../game/board";
import { CombinedTileState, TileState, SolveStep } from "../game/types";
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
const popoverRef = ref(null);
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
    primaryOptions.push(TileState.Empty);
  } else {
    switch (data.board.solveState.solveStep) {
      case SolveStep.FillBlocked: {
        primaryOptions.push(TileState.Blocked);
        break;
      }
      case SolveStep.FillSword: {
        primaryOptions.push(TileState.Sword);
        break;
      }
      case SolveStep.FillPresent: {
        primaryOptions.push(TileState.Present);
        break;
      }
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
        primaryOptions.push(...states);
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
};

const pickTile = (index: number, tileState: TileState) => {
  popoverData.value = null;
  props.board.setUserState(index, tileState);
  data.board = props.board;
};
</script>

<template>
  <div v-for="issue in data.board.issues" :key="issue.message">
    {{ issue.message }}
  </div>
  <main :class="{ focusTile: popoverOpen }">
    <GameTile
      v-for="(tile, index) in data.board.tiles"
      :ref="(el) => (popoverAnchorRefs[index] = el as any)"
      :key="index"
      class="tile"
      :class="{ focused: popoverOpen && index === popoverData?.index }"
      :tile="tile"
      @click="showTilePicker(tile, index)"
    />
  </main>
  <div
    v-if="popoverOpen && popoverData /* Make Typescript happy */"
    ref="popoverRef"
    class="overlay"
    :class="[popoverPlacement]"
    :style="{
      position: popoverStrategy,
      top: `${popoverY ?? 0}px`,
      left: `${popoverX ?? 0}px`,
    }"
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
    <div v-if="popoverData.primaryOptions" class="buttons">
      <div v-for="option in popoverData.primaryOptions" :key="`${option}`">
        <BaseTile
          :tile="option"
          @click="pickTile(popoverData!.index, option)"
        />
        {{ option }}
      </div>
    </div>
    <div v-if="popoverData.secondaryOptions" class="buttons">
      <div v-for="option in popoverData.secondaryOptions" :key="`${option}`">
        <BaseTile
          :tile="option"
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

<style scoped lang="scss">
main {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.25rem;

  &.focusTile .tile:not(.focused) {
    opacity: 0.75;
  }
}

main:not(.debug) {
  width: 0;
}
.debug {
  div {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(54, 54, 54);
    padding: 1rem;
    width: 5rem;
    height: 5rem;
  }
  gap: 1rem;
}
.overlay {
  width: max-content;
  padding: 0.5rem;
  border-radius: 5px;
  &,
  > .arrow {
    background-color: antiquewhite;
    border-color: antiquewhite;
    color: #000;
  }

  > .buttons {
    display: flex;
    // grid-auto-columns: minmax(0, 1fr);
    // grid-auto-flow: column;
    gap: 0.5rem;
    // Render the buttons over the arrow
    position: relative;
    justify-content: center;
    align-items: center;

    &:not(:last-child) {
      margin-bottom: 0.5rem;
    }
  }

  &.top,
  &.bottom {
    .buttons {
      flex-direction: row;
    }
  }

  &.left,
  &.right {
    .buttons {
      flex-direction: column;
    }
  }

  > .arrow {
    --arrow-size: 15px;
    --arrow-half-size: calc(var(--arrow-size) / 2 * -1);
    position: absolute;
    width: var(--arrow-size);
    height: var(--arrow-size);
    transform: rotate(45deg);

    &.bottom {
      top: var(--arrow-half-size);
    }
    &.top {
      bottom: var(--arrow-half-size);
    }
    &.right {
      left: var(--arrow-half-size);
    }
    &.left {
      right: var(--arrow-half-size);
    }
  }
}
</style>
