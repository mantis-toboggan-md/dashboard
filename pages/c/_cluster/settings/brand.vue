<script>
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import FileSelector from '@/components/form/FileSelector';
import SimpleBox from '@/components/SimpleBox';
import Loading from '@/components/Loading';
import AsyncButton from '@/components/AsyncButton';
import Banner from '@/components/Banner';
import { allHash } from '@/utils/promise';
import { MANAGEMENT } from '@/config/types';

export const fetchOrCreateSetting = async(store, id, val) => {
  let setting;

  try {
    setting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id });
  } catch {
    const schema = this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING);
    const url = schema.linkFor('collection');

    setting = await this.$store.dispatch('management/create', {
      type: MANAGEMENT.SETTING, metadata: { name: id }, value: val, default: val || ''
    });
    setting.save({ url });
  }

  return setting;
};
export default {
  layout: 'authenticated',

  components: {
    LabeledInput, Checkbox, FileSelector, Loading, SimpleBox, AsyncButton, Banner
  },

  async fetch() {
    const hash = await allHash({
      uiPLSetting:        this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'ui-pl' }),
      uiIssuesSetting:    this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'ui-issues' }),
      uiBannerSetting:    this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'ui-banners' }),
      uiLogoDarkSetting:  fetchOrCreateSetting(this.$store, 'ui-logo-dark', ''),
      uiLogoLightSetting: fetchOrCreateSetting(this.$store, 'ui-logo-light', ''),
    });

    Object.assign(this, hash);

    try {
      this.bannerVal = JSON.parse(hash.uiBannerSetting.value);
    } catch {
      this.bannerVal = {};
    }
    if (!this.bannerVal.banner) {
      this.$set(this.bannerVal, 'banner', {});
    }
    if (hash.uiLogoDarkSetting.value) {
      try {
        this.uiLogoDark = hash.uiLogoDarkSetting.value;
        this.customizeLogo = true;
      } catch {}
    }
    if (hash.uiLogoLightSetting.value) {
      try {
        this.uiLogoLight = hash.uiLogoLightSetting.value;

        this.customizeLogo = true;
      } catch {}
    }
  },

  data() {
    return {
      uiPLSetting: {},

      uiIssuesSetting: {},

      uiBannerSetting: null,
      bannerVal:       {},

      uiLogoDarkSetting:  {},
      uiLogoDark:         '',
      uiLogoLightSetting: {},
      uiLogoLight:        '',
      customizeLogo:      false,

      errors: []
    };
  },
  methods: {
    updateLogo(img, key) {
      // TODO check file size
      this[key] = img;
    },

    async save(btnCB) {
      this.uiBannerSetting.value = JSON.stringify(this.bannerVal);
      if (this.customizeLogo) {
        this.uiLogoLightSetting.value = this.uiLogoLight;
        this.uiLogoDarkSetting.value = this.uiLogoDark;
      } else {
        this.uiLogoLightSetting.value = '';
        this.uiLogoDarkSetting.value = '';
      }

      try {
        await Promise.all([this.uiPLSetting.save(),
          this.uiIssuesSetting.save(),
          this.uiBannerSetting.save(),
          this.uiLogoDarkSetting.save(),
          this.uiLogoLightSetting.save()]);
        this.errors = [];
        btnCB(true);
      } catch (err) {
        this.errors.push(err);
        btnCB(false);
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="uiPLSetting.value" :label="t('branding.uiPL.label')" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="uiIssuesSetting.value" :label="t('branding.uiIssues.label')" :tooltip="t(`advancedSettings.descriptions.${ 'ui-issues' }`)" />
        </div>
      </div>
      <h3>
        {{ t('branding.uiBanner.label') }}
        <i v-tooltip="t(`advancedSettings.descriptions.${ 'ui-banners' }`)" class="icon icon-info" />
      </h3>

      <div class="row mb-20">
        <Checkbox :value="bannerVal.showHeader==='true'" :label="t('branding.uiBanner.showHeader')" @input="e=>$set(bannerVal, 'showHeader', e.toString())" />
        <Checkbox :value="bannerVal.showFooter==='true'" :label="t('branding.uiBanner.showFooter')" @input="e=>$set(bannerVal, 'showFooter', e.toString())" />
      </div>
      <div v-if="bannerVal.showHeader==='true' || bannerVal.showFooter==='true'" class="row mb-20">
        <div class="col span-4">
          <LabeledInput v-model="bannerVal.banner.text" :label="t('branding.uiBanner.text')" />
        </div>
        <div class="col span-4">
          <LabeledInput v-model="bannerVal.banner.color" :label="t('branding.uiBanner.textColor')" />
        </div>
        <div class="col span-4">
          <LabeledInput v-model="bannerVal.banner.background" :label="t('branding.uiBanner.background')" />
        </div>
      </div>
      <h3>
        {{ t('branding.logos.label') }}
      </h3>
      <Checkbox v-model="customizeLogo" :label="t('branding.logos.useCustom')" />

      <div v-if="customizeLogo" class="row mb-20">
        <div class="col logo-container span-6">
          <div class="mb-10">
            <FileSelector
              :byte-limit="10000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.logos.uploadLight')"
              @selected="updateLogo($event, 'uiLogoLight')"
            />
          </div>
          <SimpleBox v-if="uiLogoLight || uiLogoDark" class="theme-light  mb-10">
            <label class="text-muted">{{ t('branding.logos.lightPreview') }}</label>
            <img class="logo-preview" :src="uiLogoLight ? uiLogoLight : uiLogoDark" />
          </SimpleBox>
        </div>
        <div class="col logo-container span-6">
          <div class="mb-10">
            <FileSelector
              :byte-limit="10000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.logos.uploadDark')"
              @error="e=>errors.push(e)"
              @selected="updateLogo($event, 'uiLogoDark')"
            />
          </div>
          <SimpleBox v-if="uiLogoDark || uiLogoLight" class="theme-dark  mb-10">
            <label class="text-muted">{{ t('branding.logos.darkPreview') }}</label>
            <img class="logo-preview" :src="uiLogoDark ? uiLogoDark : uiLogoLight" />
          </SimpleBox>
        </div>
      </div>
    </div>
    <template v-for="err in errors">
      <Banner :key="err" color="error" :label="err" />
    </template>
    <div>
      <AsyncButton class="pull-right" mode="apply" @click="save" />
    </div>
  </div>
</template>

<style scoped lang='scss'>
.logo-container{
    display: flex;
    flex-direction: column;

    ::v-deep.simple-box{
        position: relative;
        flex: 1;

        .content{
            height: 100%;
        }

        .logo-preview{
            height: 100%;
            width: 100%;
        }
    }

    & LABEL {
        position: absolute;
        top: 10px;
        left: 10px;
    }
}

</style>
