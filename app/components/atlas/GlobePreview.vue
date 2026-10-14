<template>
  <div class="globe" aria-hidden="true">
    <span class="land" />
  </div>
</template>

<style scoped>
/* The hub's picture of Atlas, beside Sudoku's board: the land seen from above the Middle East. */
.globe {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--bg);
  border: 1px solid var(--box-line);
  border-radius: 50%;
}

.land {
  position: absolute;
  inset: 0;
  background: color-mix(in oklab, var(--ink) 22%, var(--bg));
  mask: url('/atlas/globe.svg') center / 100% 100% no-repeat;
}
</style>
