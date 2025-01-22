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

  outline-width: 5px;
  outline-style: solid;
  outline-color: var(--alert-outline-color, transparent);
  em {
    font-style: italic;
    font-weight: 600;
    color: var(--alert-em-color);
  }
}

.alert-Info {
  --alert-background: var(--alert-info-background);
  --alert-color: var(--alert-info-color);
  --alert-border-color: var(--alert-info-border-color);
  --alert-outline-color: var(--alert-info-outline-color);
}

.alert-Error {
  --alert-background: var(--alert-error-background);
  --alert-color: var(--alert-error-color);
  --alert-border-color: var(--alert-error-border-color);
  --alert-outline-color: var(--alert-error-outline-color);
}
</style>
