<template>
  <p class="sf-icon-credits">
    <span>
      Icons made by
      <a href="https://lorcblog.blogspot.com/">Lorc</a>,
      <a href="https://delapouite.com/">Delapouite</a>
      &amp; Skoll
    </span>
    <span>
      <a href="https://game-icons.net/">game-icons.net</a>
      &middot;
      <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>
    </span>
  </p>
</template>

<style scoped>
.sf-icon-credits {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 8px 12px;
  margin: 0;
  padding: 0;
  background: transparent;
  color: var(--sf-muted);
  font-size: .75rem;
  line-height: 1.8;
  text-align: inherit;
  overflow-wrap: anywhere;
}

.sf-icon-credits a {
  display: inline-block;
  max-width: 100%;
  line-height: inherit;
  text-underline-offset: 3px;
}

.sf-icon-credits a:hover {
  color: var(--sf-brand);
}

.sf-icon-credits a:focus-visible {
  outline-offset: 1px;
}
</style>
