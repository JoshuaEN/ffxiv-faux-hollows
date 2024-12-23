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
  background-color: var(--alert-background);
  color: var(--alert-color);

  // https://edent.gitlab.io/paper-prototype-css/
  box-shadow: 0 0 2em var(--alert-border-color) inset;
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;

  em {
    font-style: italic;
    font-weight: 600;
    color: #880b0b;
  }
}

.alert-Info {
  --alert-background: #fffef0;
  --alert-color: var(--page-background-color);
  --alert-border-color: #b27c45;
}

.alert-Error {
  --alert-background: #fffef0;
  --alert-color: var(--page-background-color);
  --alert-border-color: #ff3c00;
}
</style>
