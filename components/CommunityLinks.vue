<script>
import { options } from '@/config/footer';
import SimpleBox from '@/components/SimpleBox';
import Closeable from '@/mixins/closeable';
import { MANAGEMENT } from '@/config/types';

export default {
  components: { SimpleBox },

  mixins: [Closeable],

  async fetch() {
    this.uiIssuesSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'ui-issues' });
    this.uiPLSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'ui-pl' });
  },

  data() {
    return { uiIssuesSetting: null };
  },
  computed: {
    pl() {
      // @TODO PL support
      return this.uiPLSetting?.value || 'rancher';
    },

    options() {
      return options(this.pl, this.uiIssuesSetting?.value);
    },
  }
};
</script>

<template>
  <SimpleBox :title="t('landing.community.title')" :pref="pref" :pref-key="prefKey">
    <div v-for="(value, name) in options" :key="name" class="support-link">
      <a v-t="name" :href="value" target="_blank" rel="noopener noreferrer nofollow" />
    </div>
  </SimpleBox>
</template>

<style lang='scss' scoped>
  .support-link:not(:first-child) {
    margin-top: 15px;
  }
</style>
