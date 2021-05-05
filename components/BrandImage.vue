<script>
import { MANAGEMENT } from '@/config/types';

export default {
  props:      {
    fileName: {
      type:     String,
      required: true
    },
    dark: {
      type:    Boolean,
      default: false
    }
  },
  async fetch() {
    this.brandSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'brand' });
    if (this.fileName === 'rancher-logo.svg') {
      try {
        this.uiLogoLight = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'ui-logo-light' });
      } catch {}
      try {
        this.uiLogoDark = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'ui-logo-dark' });
      } catch {}
    }
  },
  data() {
    const theme = this.$store.getters['prefs/theme'];

    return {
      brandSetting: null, theme, uiLogoLight: null, uiLogoDark: null
    };
  },
  computed: {
    pathToBrandedImage() {
      let out = require(`~/assets/images/pl/${ this.fileName }`);

      if (this.fileName === 'rancher-logo.svg') {
        if ((this.theme === 'light' || !this.uiLogoDark?.value) && this.uiLogoLight?.value) {
          return this.uiLogoLight?.value;
        } else if (this.uiLogoDark?.value) {
          return this.uiLogoDark?.value;
        }
      }

      if (!this.brandSetting?.value) {
        return out;
      } else {
        if (this.theme === 'dark' || this.dark) {
          try {
            out = require(`~/assets/brand/${ this.brandSetting?.value }/dark/${ this.fileName }`);

            return out;
          } catch {}
        }
        try {
          out = require(`~/assets/brand/${ this.brandSetting?.value }/${ this.fileName }`);
        } catch {
        }

        return out ;
      }
    },
    pathToRancherFallback() {
      return require(`~/assets/images/pl/${ this.fileName }`);
    }
  }
};
</script>
<template>
  <img v-bind="$attrs" :src="pathToBrandedImage" />
</template>
