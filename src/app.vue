<script setup lang="ts">
import SpreadsheetLink from "./components/building-blocks/spreadsheet-link.vue";
import GameBoard from "./components/game-board.vue";
import { Board } from "./game/board.js";

const board = new Board();
</script>

<template>
  <header>
    <h1>Faux Hollows Solver</h1>
  </header>
  <GameBoard :board="board" />
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
h1 {
  margin-top: 0;
}
.spacer {
  flex-grow: 1;
}
footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
}
.items {
  display: flex;
  flex-direction: row;
  font-size: 0.8rem;
  gap: 1ch;
  box-sizing: border-box;
}
.item {
  padding-right: 1ch;
}
.item:not(:last-child) {
  border-right: 1px solid var(--font-color);
}
</style>
