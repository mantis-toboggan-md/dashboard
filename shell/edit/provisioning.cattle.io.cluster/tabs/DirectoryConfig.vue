
<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { Banner } from '@components/Banner';

export const DATA_DIR_RADIO_OPTIONS = {
  DEFAULT: 'defaultDataDir',
  COMMON:  'commonBaseDataDir',
  CUSTOM:  'customDataDir',
};

export const DEFAULT_COMMON_BASE_PATH = '/var/lib/rancher';

export const DEFAULT_SUBDIRS = {
  AGENT:           'agent',
  PROVISIONING:    'provisioning',
  K8S_DISTRO_RKE2: 'rke2',
  K8S_DISTRO_K3S:  'k3s',
};

export default {
  name:       'DirectoryConfig',
  components: {
    LabeledInput,
    RadioGroup,
    Banner
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },

    k8sVersion: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
  },
  data() {
    return {
      DATA_DIR_RADIO_OPTIONS,
      dataConfigRadioValue: DATA_DIR_RADIO_OPTIONS.DEFAULT,
      k8sDistroSubDir:      DEFAULT_SUBDIRS.K8S_DISTRO_RKE2,
      commonConfig:         '',
    };
  },
  created() {
    if (this.k8sVersion && this.k8sVersion.includes('k3s')) {
      this.k8sDistroSubDir = DEFAULT_SUBDIRS.K8S_DISTRO_K3S;
    }

    if (this.mode !== _CREATE) {
      this.dataConfigRadioValue = DATA_DIR_RADIO_OPTIONS.CUSTOM;
    }
  },
  watch: {
    commonConfig(neu) {
      if (neu && neu.length && this.dataConfigRadioValue === DATA_DIR_RADIO_OPTIONS.COMMON) {
        this.value.systemAgent = `${ neu }/${ DEFAULT_SUBDIRS.AGENT }`;
        this.value.provisioning = `${ neu }/${ DEFAULT_SUBDIRS.PROVISIONING }`;
        this.value.k8sDistro = `${ neu }/${ this.k8sDistroSubDir }`;
      }
    },
    k8sVersion: {
      handler(neu) {
        if (neu && neu.includes('k3s')) {
          this.k8sDistroSubDir = DEFAULT_SUBDIRS.K8S_DISTRO_K3S;
        } else {
          this.k8sDistroSubDir = DEFAULT_SUBDIRS.K8S_DISTRO_RKE2;
        }

        if (this.dataConfigRadioValue === DATA_DIR_RADIO_OPTIONS.COMMON && this.commonConfig) {
          this.value.k8sDistro = `${ this.commonConfig }/${ this.k8sDistroSubDir }`;
        }
      }
    }
  },
  computed: {
    isDisabled() {
      return this.mode === _EDIT;
    },
    dataConfigRadioOptions() {
      const defaultDataDirOption = {
        value: DATA_DIR_RADIO_OPTIONS.DEFAULT,
        label: this.t('cluster.directoryConfig.radioInput.defaultLabel')
      };
      const customDataDirOption = {
        value: DATA_DIR_RADIO_OPTIONS.CUSTOM,
        label: this.t('cluster.directoryConfig.radioInput.customLabel')
      };

      if (this.mode === _CREATE) {
        return [
          defaultDataDirOption,
          { value: DATA_DIR_RADIO_OPTIONS.COMMON, label: this.t('cluster.directoryConfig.radioInput.commonLabel') },
          customDataDirOption
        ];
      } else {
        return [
          defaultDataDirOption,
          customDataDirOption
        ];
      }
    }
  },
  methods: {
    handleRadioInput(val) {
      switch (val) {
      case DATA_DIR_RADIO_OPTIONS.DEFAULT:
        if (this.mode === _CREATE) {
          this.commonConfig = '';
        }
        this.value.systemAgent = '';
        this.value.provisioning = '';
        this.value.k8sDistro = '';

        this.dataConfigRadioValue = DATA_DIR_RADIO_OPTIONS.DEFAULT;
        break;
      case DATA_DIR_RADIO_OPTIONS.COMMON:
        this.commonConfig = DEFAULT_COMMON_BASE_PATH;

        this.dataConfigRadioValue = DATA_DIR_RADIO_OPTIONS.COMMON;

        // individual data for each field is set on the watcher for commonConfig a bit further above
        break;
      default:
        // switch "default" is for the "custom" config
        if (this.mode === _CREATE) {
          this.commonConfig = '';
        }

        this.value.systemAgent = '';
        this.value.provisioning = '';
        this.value.k8sDistro = '';

        this.dataConfigRadioValue = DATA_DIR_RADIO_OPTIONS.CUSTOM;
        break;
      }
    }
  },
};
</script>

<template>
  <Banner
    class="m-0"
    :closable="false"
    color="info"
    label-key="cluster.directoryConfig.banner"
  />
  <RadioGroup
    v-show="!isDisabled"
    :value="dataConfigRadioValue"
    :mode="mode"
    :options="dataConfigRadioOptions"
    name="directory-config-radio"
    data-testid="rke2-directory-config-radio-input"
    @update:value="handleRadioInput"
  />
  <div v-if="dataConfigRadioValue === DATA_DIR_RADIO_OPTIONS.COMMON">
    <t
      k="cluster.directoryConfig.common.tooltip"
      class="text-deemphasized"
    />
    <div class="input-row mmt-1">
      <LabeledInput
        v-model:value="commonConfig"
        :mode="mode"
        :label="t('cluster.directoryConfig.common.label')"
        :disabled="isDisabled"
        class="half"
        data-testid="rke2-directory-config-common-data-dir"
      />
    </div>
  </div>
  <template v-if="dataConfigRadioValue === DATA_DIR_RADIO_OPTIONS.CUSTOM">
    <div>
      <t
        k="cluster.directoryConfig.systemAgent.tooltip"
        class="text-deemphasized"
      />
      <div class="input-row mmt-1">
        <LabeledInput
          v-model:value="value.systemAgent"
          :mode="mode"
          :label="t('cluster.directoryConfig.systemAgent.label')"
          :disabled="isDisabled"
          class="half"
          data-testid="rke2-directory-config-systemAgent-data-dir"
        />
      </div>
    </div>
    <div>
      <t
        k="cluster.directoryConfig.provisioning.tooltip"
        class="text-deemphasized"
      />
      <div class="input-row mmt-1">
        <LabeledInput
          v-model:value="value.provisioning"
          :mode="mode"
          :label="t('cluster.directoryConfig.provisioning.label')"
          :disabled="isDisabled"
          class="half"
          data-testid="rke2-directory-config-provisioning-data-dir"
        />
      </div>
    </div>
    <div>
      <t
        k="cluster.directoryConfig.k8sDistro.tooltip"
        class="text-deemphasized"
      />
      <div class="input-row mmt-1">
        <LabeledInput
          v-model:value="value.k8sDistro"
          :mode="mode"
          :label="t('cluster.directoryConfig.k8sDistro.label')"
          :disabled="isDisabled"
          class="half"
          data-testid="rke2-directory-config-k8sDistro-data-dir"
        />
      </div>
    </div>
  </template>
</template>
