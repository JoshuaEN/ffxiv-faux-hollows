<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import SpreadsheetLink from "./components/building-blocks/spreadsheet-link.vue";
import GameBoard from "./components/game-board.vue";
import { Board } from "./game/board.js";
import UndoIcon from "./components/icons/undo-icon.vue";
import ResetIcon from "./components/icons/reset-icon.vue";

const board = shallowRef(new Board());
const lastClearedBoard = shallowRef<Board | null>(null);
const hasLastClearedBoard = computed(() => lastClearedBoard.value !== null);

const noChanges = ref(true);
const disableResetButton = ref(true);

const boardChanged = (newBoard: Board) => {
  lastClearedBoard.value = null;
  disableResetButton.value = newBoard.anyUserSelectedStates === false;
  noChanges.value = false;
};
const reset = () => {
  lastClearedBoard.value = board.value;
  board.value = new Board();
};
const undoReset = () => {
  if (lastClearedBoard.value !== null) {
    board.value = lastClearedBoard.value;
    lastClearedBoard.value = null;
  }
};
</script>

<template>
  <header>
    <h1>Faux Hollows Solver</h1>
    <button
      data-testid="reset-button"
      :class="{
        'reset-button': hasLastClearedBoard !== true,
        'undo-reset-button': hasLastClearedBoard,
      }"
      :disabled="noChanges"
      @click="hasLastClearedBoard ? undoReset() : reset()"
    >
      <UndoIcon v-if="hasLastClearedBoard" />
      <ResetIcon v-else />

      <span v-if="hasLastClearedBoard">Undo</span>
      <span v-else>Reset</span>
    </button>
  </header>
  <GameBoard :board="board" v-on:board-changed="boardChanged($event)" />
  <div class="spacer" aria-hidden="true"></div>
  <footer>
    <p>
      Solver for the
      <a
        href="https://www.finalfantasyxiv.com/"
        rel="noopener noreferrer external"
        >Final Fantasy XIV</a
      >&nbsp;<a
        href="https://ffxiv.consolegameswiki.com/wiki/Faux_Hollows"
        rel="noopener noreferrer external"
        >Faux Hollows minigame</a
      >.
    </p>
    <div class="items">
      <span class="item"
        >Powered by u/Ylandah's
        <SpreadsheetLink />
      </span>
      <span class="item">Created by JoshuaEN</span>
      <span class="item">
        <a
          href="https://github.com/JoshuaEN/ffxiv-faux-hollows/issues"
          rel="noopener noreferrer external"
          >Report a problem</a
        >
      </span>
    </div>
  </footer>
</template>

<style scoped lang="scss">
header {
  display: flex;
  gap: var(--standard-margin);
  justify-content: space-between;
}
h1 {
  margin-top: 0;
}
.reset-button {
  --reset-button-hover-color: rgb(253, 99, 99);
  --reset-button-active-color: red;
  --reset-button-margin: 0;
}
.undo-reset-button {
  --reset-button-hover-color: rgb(255, 230, 91);
  --reset-button-active-color: gold;
  --reset-button-margin: -0.5rem;
}
.reset-button,
.undo-reset-button {
  background-color: transparent;
  color: var(--font-color);
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: end;
  outline: none !important;
  transition-property: opacity visibility;
  transition-duration: 150ms;
  transition-timing-function: linear;
  transition-behavior: allow-discrete;

  visibility: visible;
  opacity: 1;

  svg {
    height: calc(3.2em * 1.1);
    aspect-ratio: 1 / 1;
    margin-right: var(--reset-button-margin);
  }

  &:disabled {
    visibility: hidden;
    opacity: 0;
  }

  &:hover,
  &:focus-within {
    color: var(--reset-button-hover-color);
    filter: brightness(100%);
  }
  &:active {
    color: var(--reset-button-active-color);
    filter: brightness(100%);
  }
}
.spacer {
  flex-grow: 1;
}
footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;

  @media (hover: hover) {
    opacity: 0.9;
  }

  &:hover {
    opacity: 1;
  }

  p {
    text-align: center;
  }

  p:not(:first-child) {
    margin-top: 0;
  }

  .items {
    display: flex;
    flex-direction: row;
    font-size: 0.8rem;
    gap: 1ch;
    box-sizing: border-box;
    margin-top: 1rem;
  }
  .item {
    padding-right: 1ch;
  }
  .item:not(:last-child) {
    border-right: 1px solid var(--font-color);
  }
}
</style>
