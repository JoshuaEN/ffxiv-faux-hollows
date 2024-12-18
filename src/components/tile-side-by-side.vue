<script setup lang="ts">
import { TileState } from "../game/types";
import BaseTile from "./base-tile.vue";
import blockedIcon from "~/assets/InGame/Blocked.png";
import unknownIcon from "~/assets/InGame/Unknown.png";
import foxIcon from "~/assets/InGame/Fox.png";
import swordIcon from "~/assets/InGame/Swords.png";
import swordIconVert from "~/assets/InGame/SwordsVert.png";
import coffersIcon from "~/assets/InGame/Coffers.png";
import giftBoxesIcon from "~/assets/InGame/GiftBoxes.png";
import emptyIcon from "~/assets/InGame/Empty.png";
import { computed } from "vue";

const props = defineProps<{ tile: TileState }>();

const inGameImages: Record<TileState, string | [string, string]> = {
  [TileState.Blocked]: blockedIcon,
  [TileState.Unknown]: unknownIcon,
  [TileState.Fox]: foxIcon,
  [TileState.Sword]: [swordIcon, swordIconVert],
  [TileState.Present]: [coffersIcon, giftBoxesIcon],
  [TileState.Empty]: emptyIcon,
} as const;

const singleImage = computed(() => {
  const img = inGameImages[props.tile];
  return Array.isArray(img) ? null : img;
});
const dualImage = computed(() => {
  const img = inGameImages[props.tile];
  return Array.isArray(img) ? img : null;
});
</script>

<template>
  <section class="figure-set">
    <figure v-if="singleImage !== null">
      <img
        :src="singleImage"
        :alt="`Example of an uncovered in-game ${tile} tile.`"
        class="in-game-tile-example"
      />
      <figcaption>(in game)</figcaption>
    </figure>
    <figure v-else-if="dualImage !== null">
      <img :src="dualImage[0]" class="in-game-tile-example" />
      <img :src="dualImage[1]" class="in-game-tile-example" />
      <figcaption>(in game)</figcaption>
    </figure>
    <figure>
      <span class="in-this-tool-tile-example"
        ><BaseTile :tile="tile" disabled></BaseTile
      ></span>
      <figcaption>(in this tool)</figcaption>
    </figure>
  </section>
</template>

<style>
.figure-set {
  display: inline flex;
  gap: 1rem;
  flex-direction: row;
  justify-content: space-around;
  justify-items: end;
  flex-wrap: nowrap;
}
</style>
