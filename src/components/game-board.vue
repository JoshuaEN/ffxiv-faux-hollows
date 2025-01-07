<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { Board } from "~/src/game/board.js";
import {
  CombinedTileState,
  SmartFillTileState,
  TileState,
} from "~/src/game/types/index.js";
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
import SolveStepsActiveHelp from "~/src/components/solve-steps-active-help.vue";
import { TileStateDisplayName } from "./tile.utils.js";
import AlertMessage from "./building-blocks/alert-message.vue";
import { AlertMessageKind } from "./building-blocks/alert-message.types.js";
import ActiveHelp from "./building-blocks/active-help.vue";
import SpreadsheetLink from "./building-blocks/spreadsheet-link.vue";

const popoverAnchorRef = ref(null);
const popoverAnchorRefs = ref<unknown[]>([]);
const popoverRef = ref<HTMLDivElement | null>(null);
const popoverArrowRef = ref(null);
const popoverMiddleware = ref([
  offset({ mainAxis: 10 }),
  flip(),
  shift({ padding: 16 }),
  arrow({
    element: computed(() => {
      const val = popoverArrowRef.value;
      if (Array.isArray(val)) {
        return val[0];
      }
      return val;
    }),
  }),
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
  primaryOptions: Set<TileState>;
  options: TileState[];
  message: { identifier: "SMART_FILL"; tileState: SmartFillTileState } | null;
  index: number;
} | null>(null);
const popoverOpen = computed(
  () =>
    popoverData.value !== null &&
    popoverAnchorRefs.value[popoverData.value.index] !== null
);

const props = defineProps<{ board: Board }>();
const data = props;

const hideTilePicker = () => {
  popoverData.value = null;
  cancelPopoverRefAnimationFrame();
};

let popoverRefAnimationFrame: number | null = null;
const cancelPopoverRefAnimationFrame = () => {
  if (popoverRefAnimationFrame !== null) {
    window.cancelAnimationFrame(popoverRefAnimationFrame);
    popoverRefAnimationFrame = null;
  }
};
const showTilePicker = (tileState: CombinedTileState, index: number) => {
  popoverAnchorRef.value = popoverAnchorRefs.value[index] as null;
  popoverData.value = {
    index,
    ...getPickerOptions(data.board, tileState, index),
  };
};

// Code to allow clicking on the tile with the currently open popover to close the popover.
//
// This is needed because the event order is:
// 1. mousedown
// 2. focusout (on the popover)
// 3. click
// There is a race condition where by the time the click event runs, the popover has already been closed by the focus out,
// so we have to check in mousedown and then pass that state over to click.
const skipNextClick = ref(false);
const tileMouseDown = (ev: MouseEvent, index: number) => {
  ev.stopImmediatePropagation();
  skipNextClick.value = popoverOpen.value && index === popoverData.value?.index;
};
const tileClicked = (
  ev: MouseEvent | KeyboardEvent,
  tile: CombinedTileState,
  index: number
) => {
  ev.preventDefault();
  ev.stopImmediatePropagation();
  if (skipNextClick.value) {
    skipNextClick.value = false;
    return;
  }

  showTilePicker(tile, index);
};

const pickTile = (index: number, tileState: TileState) => {
  hideTilePicker();
  props.board.setUserState(index, tileState);
};

watch(popoverRef, () => {
  if (popoverRef.value !== null) {
    popoverRef.value.focus();
    cancelPopoverRefAnimationFrame();
    popoverRefAnimationFrame = window.requestAnimationFrame(() => {
      popoverRefAnimationFrame = null;
      const elm = popoverRef.value?.querySelector(
        "button:not(:disabled)"
      ) as HTMLElement | null;
      elm?.focus();
    });
  }
});

onUnmounted(() => {
  cancelPopoverRefAnimationFrame();
});
</script>

<template>
  <section class="chips">
    <span
      v-if="data.board.solveState.totalCandidatePatterns !== null"
      class="chip"
    >
      Remaining patterns:
      <span data-testid="remaining-patterns">{{
        data.board.solveState.totalCandidatePatterns
      }}</span>
    </span>
    <span
      v-if="board.solveState.getPatternIdentifier() !== null"
      class="chip"
      data-testid="pattern-identifier"
    >
      {{
        board.solveState.getPatternIdentifier()?.length === 1
          ? `${board.solveState.getPatternIdentifier()}↑`
          : board.solveState.getPatternIdentifier()
      }}
    </span>
  </section>
  <main
    :class="{ focusTile: popoverOpen, gameBoard: true }"
    data-testid="game-board"
  >
    <template v-for="(tile, index) in data.board.tiles" :key="index">
      <GameTile
        :ref="(el: any) => (popoverAnchorRefs[index] = el)"
        class="tile"
        :class="{
          focused: popoverOpen && index === popoverData?.index,
          hasIssue: data.board.tilesWithIssues.has(index),
        }"
        :tile="tile"
        :index="index"
        :data-testid="`game-tile-index-${index}`"
        :data-test-tile="tile"
        :data-test-tile-is-array="Array.isArray(tile)"
        @mousedown.left="(ev: MouseEvent) => tileMouseDown(ev, index)"
        @click="(ev: MouseEvent) => tileClicked(ev, tile, index)"
      />
      <div v-if="popoverData?.index === index" :data-popover-tp="index"></div>
    </template>
  </main>
  <Teleport
    :to="`[data-popover-tp=&quot;${popoverData?.index}&quot;]`"
    :disabled="!popoverOpen"
  >
    <!-- Popover -->
    <!-- We put this inside the game tile loop so the tab index is correct -->
    <div
      v-if="popoverOpen && popoverData"
      :ref="
        (el) => {
          if (el !== popoverRef) {
            popoverRef = null;
          }
          popoverRef = el as HTMLDivElement | null;
        }
      "
      class="overlay"
      role="dialog"
      aria-label="Tile picker"
      aria-description="Select the tile type to fill into the selected tile."
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
            ? hideTilePicker()
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
      <div v-if="popoverData.options.length" class="buttons">
        <div
          v-for="option in popoverData.options"
          :key="`${option}`"
          :data-testid="
            popoverData.primaryOptions.has(option)
              ? 'popover-picker-primary-option'
              : 'popover-picker-secondary-option'
          "
        >
          <BaseTile
            :tile="option"
            :data-testid="`popover-picker-button-${option}`"
            :data-test-tile-state="option"
            :class="{ faded: !popoverData.primaryOptions.has(option) }"
            @click="pickTile(popoverData!.index, option)"
          />
          {{ TileStateDisplayName[option] }}
        </div>
      </div>
      <div v-if="popoverData.message" class="message">
        <template v-if="popoverData.message.identifier === 'SMART_FILL'">
          <p>
            This tile must be a
            {{
              popoverData.message.tileState ===
              SmartFillTileState.SmartFillBlocked
                ? "Blocked"
                : popoverData.message.tileState ===
                    SmartFillTileState.SmartFillSword
                  ? "Sword"
                  : "Present"
            }}
            tile based on the other tiles on the board.
          </p>
          <p>
            If this tile is not correct, please ensure the tiles entered onto
            the board are correct.
          </p>
          <p>
            Tip: Entered tiles have solid borders:<br /><span
              class="game-tile-backdrop"
              ><GameTile
                :tile="
                  popoverData.message.tileState ===
                  SmartFillTileState.SmartFillBlocked
                    ? TileState.Blocked
                    : popoverData.message.tileState ===
                        SmartFillTileState.SmartFillSword
                      ? TileState.Sword
                      : TileState.Present
                "
                :disabled="true"
              ></GameTile></span
            ><br />While tiles which have been automatically determined (like
            this one) have dashed borders:<br /><span class="game-tile-backdrop"
              ><GameTile
                :tile="popoverData.message.tileState"
                :disabled="true"
              ></GameTile
            ></span>
          </p>
        </template>
      </div>
    </div>
  </Teleport>
  <AlertMessage
    v-for="issue in data.board.issues"
    :key="issue.message"
    :kind="AlertMessageKind.Error"
    data-testid="solve-step-help-tldr"
    :data-test-issue-severity="issue.severity"
  >
    <span data-testid="message">{{ issue.message }}</span>
  </AlertMessage>
  <ActiveHelp v-if="data.board.issues.length > 0" title="Resolving Issues">
    <template #active-help>
      <p>
        If the tiles entered <em>in this tool</em> do not match any of the
        patterns in the <SpreadsheetLink />, an error will be display.
      </p>
      <p>
        When this happens, please confirm the tiles entered
        <em>in this tool</em> match the tiles as they appear <em>in game</em>.
      </p>
      <p>
        Tip: Tiles which appear to be the source of the issue will be marked
        with a red outline:
        <span class="game-tiles game-tiles-has-issue">
          <span class="game-tile-backdrop hasIssue"
            ><GameTile :tile="TileState.Blocked" :disabled="true"></GameTile
          ></span>
          <span class="game-tile-backdrop hasIssue"
            ><GameTile :tile="TileState.Empty" :disabled="true"></GameTile>
          </span>
          <span class="game-tile-backdrop hasIssue"
            ><GameTile :tile="TileState.Sword" :disabled="true"></GameTile
          ></span>
          <span class="game-tile-backdrop hasIssue"
            ><GameTile :tile="TileState.Present" :disabled="true"></GameTile>
          </span>
          <span class="game-tile-backdrop hasIssue"
            ><GameTile :tile="TileState.Fox" :disabled="true"></GameTile>
          </span>
        </span>
      </p>
      <p>
        Tip: Entered tiles have solid borders:<br /><span class="game-tiles">
          <span class="game-tile-backdrop"
            ><GameTile :tile="TileState.Blocked" :disabled="true"></GameTile
          ></span>
          <span class="game-tile-backdrop"
            ><GameTile :tile="TileState.Empty" :disabled="true"></GameTile>
          </span>
          <span class="game-tile-backdrop"
            ><GameTile :tile="TileState.Sword" :disabled="true"></GameTile
          ></span>
          <span class="game-tile-backdrop"
            ><GameTile :tile="TileState.Present" :disabled="true"></GameTile>
          </span>
          <span class="game-tile-backdrop"
            ><GameTile :tile="TileState.Fox" :disabled="true"></GameTile>
          </span> </span
        ><br />While tiles which have been automatically determined have dashed
        borders:<br /><span class="game-tiles">
          <span class="game-tile-backdrop"
            ><GameTile
              :tile="SmartFillTileState.SmartFillBlocked"
              :disabled="true"
            ></GameTile
          ></span>
          <span class="game-tile-backdrop"
            ><GameTile
              :tile="SmartFillTileState.SmartFillSword"
              :disabled="true"
            ></GameTile
          ></span>
          <span class="game-tile-backdrop"
            ><GameTile
              :tile="SmartFillTileState.SmartFillPresent"
              :disabled="true"
            ></GameTile
          ></span>
        </span>
      </p>
      <p>
        Tip: Tiles which have been automatically determined cannot be changed.
      </p>
    </template>
  </ActiveHelp>
  <SolveStepsActiveHelp
    v-else-if="data.board.solveState?.solveStep !== undefined"
    :solve-step="data.board.solveState.solveStep"
  />
  <main v-if="showDebugInfo" class="debug gameBoard">
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
