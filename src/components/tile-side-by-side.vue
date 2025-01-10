<script setup lang="ts">
import { TileState } from "../game/types";
import BaseTile from "./base-tile.vue";
import blockedIcon from "~/assets/InGame/Blocked.webp";
import blockedIconMetadata from "~/assets/InGame/Blocked.webp?metadata";
import unknownIcon from "~/assets/InGame/Unknown.webp";
import unknownIconMetadata from "~/assets/InGame/Unknown.webp?metadata";
import foxIcon from "~/assets/InGame/Fox.webp";
import foxIconMetadata from "~/assets/InGame/Fox.webp?metadata";
import emptyIcon from "~/assets/InGame/Empty.webp";
import emptyIconMetadata from "~/assets/InGame/Empty.webp?metadata";
import { computed } from "vue";

type SupportedTileStates =
  | TileState.Blocked
  | TileState.Unknown
  | TileState.Fox
  | TileState.Empty;

const props = defineProps<{ tile: SupportedTileStates }>();

const inGameImages = {
  [TileState.Blocked]: [blockedIcon, blockedIconMetadata],
  [TileState.Unknown]: [unknownIcon, unknownIconMetadata],
  [TileState.Fox]: [foxIcon, foxIconMetadata],
  [TileState.Empty]: [emptyIcon, emptyIconMetadata],
} as const;

const image = computed(() => {
  const [img, size] = inGameImages[props.tile];
  return { img, size };
});
</script>

<template>
  <section class="figure-set">
    <figure v-if="image !== null">
      <img
        :src="image.img"
        :height="image.size.height"
        :width="image.size.width"
        :alt="`Example of an uncovered in-game ${tile} tile.`"
        class="in-game-tile-example"
      />
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
