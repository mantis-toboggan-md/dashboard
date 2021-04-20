<script>
import BannerGraphic from '@/components/BannerGraphic';
import IndentedPanel from '@/components/IndentedPanel';
import { MANAGEMENT } from '@/config/types';

export default {
  layout:     'home',
  components:      {
    BannerGraphic,
    IndentedPanel,
  },
  async fetch() {
    const uiplSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'ui-pl' });

    this.uiPL = uiplSetting.value;
  },
  data() {
    return { uiPL: '' };
  },
};

</script>
<template>
  <div class="home-page">
    <BannerGraphic :small="true" :title="t('login.welcome', {vendor: uiPL})" />
    <IndentedPanel class="mt-20">
      <h1>Insert Home Page Here</h1>
    </IndentedPanel>
  </div>
</template>
<style lang="scss">
.home-page {
  .search {
    background-color: transparent;
    padding: 8px;
  }
}
</style>
