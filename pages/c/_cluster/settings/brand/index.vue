<script>
import { MANAGEMENT } from '@/config/types';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import AsyncButton from '@/components/AsyncButton';
import Banner from '@/components/Banner';
import { stringify } from '@/utils/error';

export default {

  components: {
    RadioGroup,
    LabeledInput,
    AsyncButton,
    Banner
  },

  async fetch() {
    let brandSetting;

    try {
      brandSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'brand' });
    } catch {
      const schema = this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING);
      const url = schema.linkFor('collection');

      brandSetting = await this.$store.dispatch('management/create', {
        type: MANAGEMENT.SETTING, metadata: { name: 'brand' }, value: '', default: ''
      });
      brandSetting.save({ url });
    }
    if (!brandSetting.value || brandSetting.value === '' || brandSetting.value === 'suse') {
      this.themeSource = brandSetting.value || 'default';
    } else {
      this.themeSource = 'custom';
      this.brand = brandSetting.value;
    }
    this.brandSetting = brandSetting;
  },

  data() {
    return {
      brandSetting: null, brand: '', themeSource: '', primaryColorString: '', errors: []
    };
  },

  watch: {
    themeSource(neu, old) {
      if (neu === 'default' && old !== 'default' && old !== '') {
        this.brand = '';
        this.updateBrand();
      } else if (neu === 'suse') {
        this.brand = neu;
        this.updateBrand();
      }
    },
  },

  methods: {
    updateTheme() {
      const theme = this.$store.getters['prefs/theme'];

      this.$store.dispatch('prefs/setBrand', theme === 'dark');
    },

    async updateBrand(btnCB = () => {}) {
      this.brandSetting.value = this.brand;
      await this.brandSetting.save();
      this.updateTheme();
      btnCB(true);
    },

    stringify
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <RadioGroup
        v-model="themeSource"
        label="Choose a new UI Theme"
        name="theme-source"
        :options="[{value: 'default', label:t('branding.options.default')}, {value: 'suse', label:t('branding.options.suse')}, {value: 'custom', label:t('branding.options.custom')}]"
      />
    </div>
    <template v-if="themeSource === 'custom'">
      <div class="row">
        <div class="col span-3">
          <LabeledInput v-model="brand" :placeholder="'e.g. my-company'" :label="t('branding.directoryName')" />
        </div>
        <!-- <div class="col span-3">
        <LabeledInput v-model="primaryColorString" :placeholder="'e.g. rgb(65, 152, 211)'" label="Primary Color" />
      </div> -->
        <AsyncButton @click="updateBrand" />
      </div>
    </template>
    <div
      v-for="(err, idx) in errors"
      :key="idx"
    >
      <Banner
        color="error"
        :label="stringify(err)"
      />
    </div>
  </div>
</template>
