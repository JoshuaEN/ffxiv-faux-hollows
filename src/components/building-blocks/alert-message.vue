<script setup lang="ts">
import { computed } from "vue";
import { AlertMessageKind } from "./alert-message.types.js";

const props = withDefaults(
  defineProps<{
    kind: AlertMessageKind;
  }>(),
  { kind: AlertMessageKind.Error }
);
const ariaRole = computed(() => {
  return props.kind === AlertMessageKind.Error ? "alert" : "status";
});
</script>

<template>
  <section class="alert" :class="{ [`alert-${kind}`]: true }" :role="ariaRole">
    <slot></slot>
  </section>
</template>

<style scoped>
.alert {
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  border-radius: 0.5rem;
  border-width: 2px;
  border-style: var(--alert-border-style, solid);
  border-color: var(--alert-border-color);
  background-color: var(--alert-background);
  color: var(--alert-color);
  max-width: fit-content;
}

.alert-Info {
  --alert-border-style: none;
  --alert-background: transparent;
  --alert-color: var(--text-color);
  --alert-border-color: hsl(30 38% 30% / 1);
}
.alert-Warn {
  --alert-background: hsl(49, 100%, 34%);
  --alert-color: var(--text-color);
  --alert-border-color: hsl(49, 100%, 45%);
}
.alert-Error {
  --alert-background: hsl(0, 100%, 34%);
  --alert-color: var(--text-color);
  --alert-border-color: hsl(0, 100%, 45%);
}
</style>
