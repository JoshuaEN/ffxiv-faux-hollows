<script setup lang="ts">
import GameBoard from "./components/game-board.vue";
import { Board } from "./game/board.js";

const board = new Board();
</script>

<template>
  <h1>Faux Hollows Solver</h1>
  <GameBoard :board="board" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
