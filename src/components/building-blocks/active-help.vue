<script setup lang="ts">
const open = defineModel<boolean>("activeHelpOpen");
defineProps<{ title: string }>();
</script>
<template>
  <details
    :open="open"
    class="active-help"
    @toggle="($event: ToggleEvent) => (open = $event.newState === 'open')"
  >
    <summary>
      <span class="icon-pos">
        <span class="icon-wrap">
          <span class="icon-wrap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              class="icon"
            >
              <filter id="blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" />
              </filter>
              <path
                fill="currentColor"
                filter="url(#blur)"
                d="M 9 19 H 15 V 24 H 9 V 19 M 15 3 C 23.7 3.22 27 8 23 12 C 21 14 20 15 16 15 C 15 16 15 17 15 17 H 9 C 9 16.33 9 14.92 9 14 C 9 11 10 11 15 11 C 17 11 18 10 18 9 L 18 9 C 18 8 17 7 15 7 L 10 7 C 8 7 7 8 7 9 L 7 10 H 1 C 1 9.6667 1 9 1 9 C 1 6 4 3 10 3 Z"
              />
            </svg>
          </span>
        </span>
      </span>
      <span class="title-text">{{ title }}</span>
    </summary>
    <section class="content-wrapper">
      <div class="content">
        <slot name="active-help"></slot>
        <div class="clear-fix" aria-hidden="true"></div>
      </div>
    </section>
  </details>
</template>

<style scoped lang="scss">
@use "../../scss/helpers.scss";
summary {
  --background-gradient: var(--active-help-background-gradient);
  --background-base: var(--active-help-background-base);
  position: relative;
  display: inline flex;
  padding: 2px;
  align-items: center;
  user-select: none;
  border-width: 3px 3px 3px 3px;
  border-style: ridge groove groove ridge;
  border-color: var(--active-help-globe-border-color);
  border-radius: 12px;
  cursor: pointer;
  background: linear-gradient(
      180deg,
      var(--background-gradient),
      lab(from var(--background-base) l a b / 0) 80%
    ),
    linear-gradient(0deg, var(--background-base), var(--background-base));
  // I have no idea why, but without this, the z-order doesn't work correctly.
  filter: brightness(100%);

  &:hover {
    background: linear-gradient(
        180deg,
        helpers.adjustBrightness(var(--background-gradient), 10),
        helpers.setAlpha(var(--background-base), 0) 80%
      ),
      linear-gradient(0deg, var(--background-base), var(--background-base));
  }
  &:active {
    background: linear-gradient(
        180deg,
        helpers.adjustBrightness(var(--background-gradient), 20),
        helpers.setAlpha(var(--background-base), 0) 80%
      ),
      linear-gradient(0deg, var(--background-base), var(--background-base));
  }
  &:focus-within {
    outline: none;
  }

  &:hover,
  &:focus-within {
    .icon-pos {
      filter: brightness(115%);
    }
  }
  &:active .icon-pos {
    filter: brightness(125%);
  }
}

details {
  padding: 1rem;
  color: var(--dark-bg-font-color);
  &[open] summary {
    display: flex;
    justify-content: center;
    border-radius: 12px 12px 0 0;
    border-bottom-width: 0;
    border-color: var(--active-help-globe-border-color);
  }

  &:not([open]) summary .title-text {
    margin-left: 48px;
    margin-right: 48px;
  }

  ::marker {
    list-style: none;
    content: "";
  }
}

.content-wrapper {
  border-radius: 0 0 12px 12px;
  border-width: 0 3px 3px 3px;
  border-color: var(--active-help-globe-border-color);
  border-style: ridge groove groove ridge;
  overflow: hidden;
}

.content {
  background-color: var(--active-help-content-background);
  box-shadow:
    inset 1px 1px 0px var(--active-help-content-border-color),
    inset -1px -1px 0px var(--active-help-content-border-color);
  border-left: 12px solid var(--active-help-background-base);
  border-right: 12px solid var(--active-help-background-base);
  border-bottom: 24px solid var(--active-help-background-base);
  padding: 1rem;

  > :first-child {
    margin-top: 0;
  }
}

.clear-fix {
  clear: both;
}

.icon-pos {
  position: absolute;
  left: -18px;
  top: -11px;
}
.icon {
  font-size: 48px;
  font-weight: bold;
  border-radius: 50%;
  background: radial-gradient(
    var(--active-help-globe-glassy-background-radial-gradient-1) 40%,
    var(--active-help-globe-glassy-background-radial-gradient-2) 65%,
    var(--active-help-globe-glassy-background-radial-gradient-3) 80%
  );
  border: 4px solid var(--active-help-globe-outer-border-color);
  aspect-ratio: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}
.icon-wrap {
  height: 48px;
  width: 48px;
  display: block;
}
// Bottom shadow
.icon-wrap::after {
  display: block;
  height: 48px;
  width: 48px;
  position: absolute;
  top: 0px;
  left: 0px;
  z-index: 4;
  border-radius: 50%;
  content: "";
  box-shadow: inset 0px -2px 1px
    helpers.adjustBrightness(var(--active-help-globe-glassy-bottom-shadow), -70);
}
.icon-wrap-2 {
  width: 100%;
  height: 100%;
  display: block;
}
// Darken edge
.icon-wrap-2::before {
  display: block;
  height: 48px;
  width: 48px;
  position: absolute;
  top: 0px;
  left: 0px;
  z-index: 4;
  border-radius: 50%;
  content: "";
  box-shadow: inset 0px 0px 2px var(--active-help-globe-darken-edge-color);
}
// Top inset
.icon-wrap-2::after {
  display: block;
  height: 40px;
  width: 41px;
  position: absolute;
  top: 3px;
  left: 3.5px;
  z-index: 4;
  border-radius: 50%;
  content: "";
  box-shadow: inset 0px 2px 2px var(--active-help-globe-top-inset-color);
}
// Glassy highlight
.icon-wrap::before {
  display: block;
  height: 29px;
  width: 36px;
  position: absolute;
  top: 3.8px;
  left: 6px;
  z-index: 4;
  border-radius: 50%/54% 54% 41% 41%;
  background: linear-gradient(
    var(--active-help-globe-glassy-highlight-from-color),
    var(--active-help-globe-glassy-highlight-to-color)
  );
  content: "";
}
</style>
