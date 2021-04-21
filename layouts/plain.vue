<script>
import Header from '@/components/nav/Header';
import Brand from '@/mixins/brand';

export default {

  components: { Header },
  mixins:     [Brand],

  middleware: ['authenticated'],

};
</script>

<template>
  <div class="dashboard-root">
    <Header />

    <main>
      <nuxt class="outlet" />
    </main>
  </div>
</template>

<style lang="scss" scoped>
  .dashboard-root {
    display: grid;
    height: 100vh;

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
