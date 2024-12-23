<script setup lang="ts">
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
    <span class="item"
      >Powered by
      <a
        href="https://docs.google.com/spreadsheets/d/1mUyCzlzDmdXMwaSTUgWXtEA45oJNn-iB4_bVM43zf58/edit?gid=49331949#gid=49331949"
        rel="noopener noreferrer external"
        >u/Ylandah's Community Data Spreadsheet</a
      >
    </span>
    <span class="item">Created by JoshuaEN</span>
    <span class="item">
      <a
        href="https://github.com/JoshuaEN/ffxiv-faux-hollows"
        rel="noopener noreferrer external"
        >Source Code</a
      >
    </span>
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
  opacity: 0.5;
  font-size: 0.8rem;
  padding-top: 1rem;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  gap: 1ch;
  box-sizing: border-box;

  &:hover {
    opacity: 1;
  }
}
.item {
  padding-right: 1ch;
}
.item:not(:last-child) {
  border-right: 1px solid var(--font-color);
}
</style>
