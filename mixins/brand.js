import { MANAGEMENT } from '@/config/types';

export default {
  async fetch() {
    this.brandSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'brand' });
  },

  data() {
    return { brandSetting: null };
  },

  head() {
    const theme = this.$store.getters['prefs/theme'];

    let cssClass = `overflow-hidden dashboard-body`;

    const brand = this.brandSetting?.value;
    let brandMeta;

    try {
      brandMeta = require(`~/assets/brand/${ brand }/metadata.json`);
    } catch {
      return {
        bodyAttrs: { class: `theme-${ theme } ${ cssClass }` },
        title:     this.$store.getters['i18n/t']('nav.title'),
      };
    }

    if (brandMeta?.hasStylesheet === 'true') {
      cssClass = `${ cssClass } ${ brand }-${ theme }`;
    } else {
      cssClass = `theme-${ theme } overflow-hidden dashboard-body`;
      this.$store.dispatch('prefs/setBrandStyle', theme === 'dark');
    }

    return {
      bodyAttrs: { class: cssClass },
      title:     this.$store.getters['i18n/t']('nav.title'),
    };
  },

};
