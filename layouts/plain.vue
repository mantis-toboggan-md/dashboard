<script>
import Header from '@/components/nav/Header';
import FixedBanner from '@/components/FixedBanner';

import Brand from '@/mixins/brand';

export default {

  components: { Header, FixedBanner },
  mixins:     [Brand],

  middleware: ['authenticated'],

};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner />

    <div class="dashboard-content">
      <Header />

      <main>
        <nuxt class="outlet" />
      </main>
    </div>
    <FixedBanner :footer="true" />
  </div>
</template>

<style lang="scss" scoped>
  .dashboard-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  .dashboard-content {
    display: grid;
    flex-grow: 1;

    grid-template-areas:
      "header"
      "main";

    grid-template-columns: auto;
    grid-template-rows:    var(--header-height) auto;

    > HEADER {
      grid-area: header;
    }
  }

  MAIN {
    grid-area: main;
    overflow: auto;

    .outlet {
      padding: 20px;
      min-height: 100%;
    }

    FOOTER {
      background-color: var(--nav-bg);
      height: var(--footer-height);
    }
  }
</style>
