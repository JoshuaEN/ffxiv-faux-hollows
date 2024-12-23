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

<style lang="scss">
.alert {
  padding: 1.5rem 1rem;
  margin: 1rem 0;
  border-radius: 0.5rem;
  border-width: 2px;
  border-style: var(--alert-border-style, solid);
  border-color: var(--alert-border-color);
  background-color: var(--alert-background);
  color: var(--alert-color);

  em {
    font-style: italic;
    font-weight: 600;
    color: #880b0b;
  }
}

.alert-Info {
  --alert-border-style: aliceblue;
  --alert-background: #e1d8c7;
  --alert-color: var(--page-background-color);
  --alert-border-color: hsl(30 38% 30% / 1);
  // https://edent.gitlab.io/paper-prototype-css/
  box-shadow: 0 0 2em #b27c45 inset;
  background: #fffef0;
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
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
