<script>
import { MANAGEMENT } from '@/config/types';
export default {
  props: {
    footer: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    this.bannerSetting = await this.$store.dispatch('management/find', { id: 'ui-banners', type: MANAGEMENT.SETTING });
  },
  data() {
    return {
      showHeader: false, showFooter: false, banner: {}, bannerSetting: null
    };
  },

  computed: {
    bannerStyle() {
      return {
        color:              this.banner.color,
        'background-color': this.banner.background
      };
    }
  },

  watch: {
    bannerSetting(neu) {
      if (neu.value && neu.value !== '') {
        try {
          const parsed = JSON.parse(neu.value);

          this.showHeader = parsed.showHeader === 'true';

          this.showFooter = parsed.showFooter === 'true';
          this.banner = parsed.banner;
        } catch {}
      }
    }
  }
};
</script>

<template>
  <div v-if="(showHeader && !footer) || (showFooter && footer)" class="banner" :style="bannerStyle">
    {{ banner.text }}
  </div>
</template>

<style scoped>
    .banner {
        text-align: center;
        line-height: 2em;
        height: 2em;
        width: 100%;
    }
</style>
