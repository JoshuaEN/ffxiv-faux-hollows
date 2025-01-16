<script setup lang="ts">
import ActiveHelp from "./building-blocks/active-help.vue";
import AlertMessage from "./building-blocks/alert-message.vue";
import { AlertMessageKind } from "./building-blocks/alert-message.types";
const open = defineModel<boolean>("activeHelpOpen");
defineProps<{ activeHelpTitle: string }>();
</script>

<template>
  <AlertMessage
    :kind="AlertMessageKind.Info"
    data-testid="solve-step-help-tldr"
  >
    <slot></slot>
  </AlertMessage>
  <ActiveHelp
    v-model:active-help-open="open"
    :title="activeHelpTitle"
    data-testid="primary-active-help"
  >
    <template #active-help>
      <slot name="active-help"></slot>
    </template>
  </ActiveHelp>
</template>

<style scoped lang="scss"></style>
