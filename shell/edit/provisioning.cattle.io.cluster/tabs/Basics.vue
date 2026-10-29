<script>
import difference from 'lodash/difference';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import { set, get } from '@shell/utils/object';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import YamlEditor from '@shell/components/YamlEditor';
import semver from 'semver';
import Ingress from '@shell/edit/provisioning.cattle.io.cluster/ingress/index';
import { RcSection } from '@components/RcSection';
import { RcContentGroup } from '@components/Layout';
import {
  HARVESTER, RKE2_INGRESS_NGINX, RKE2_TRAEFIK, INGRESS_CONTROLLER, INGRESS_NGINX, INGRESS_NONE
} from '@shell/edit/provisioning.cattle.io.cluster/shared';

export default {
  emits: ['enabled-system-services-changed', 'cilium-values-changed', 'kubernetes-changed', 'show-deprecated-patch-versions-changed', 'compliance-changed', 'psa-default-changed', 'update-values', 'error', 'yaml-validation-changed', 'config-validation-changed'],

  components: {
    Banner,
    Checkbox,
    LabeledSelect,
    YamlEditor,
    Ingress,
    RcSection,
    RcContentGroup
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    provider: {
      type:     String,
      required: true,
    },

    credential: {
      type:     Object,
      default:  null,
      required: false
    },
    userChartValues: {
      type:     Object,
      required: true
    },
    versionInfo: {
      type:     Object,
      required: true
    },
    complianceOverride: {
      type:     Boolean,
      required: true
    },

    allPsas: {
      type:     Array,
      required: true
    },

    addonVersions: {
      type:     Array,
      required: false,
      default:  null
    },

    selectedVersion: {
      type:     Object,
      required: true
    },
    versionOptions: {
      type:     Array,
      required: true
    },
    isHarvesterDriver: {
      type:     Boolean,
      required: true
    },
    isHarvesterIncompatible: {
      type:     Boolean,
      required: true
    },
    showDeprecatedPatchVersions: {
      type:     Boolean,
      required: true
    },
    isElementalCluster: {
      type:     Boolean,
      required: true
    },
    haveArgInfo: {
      type:     Boolean,
      required: true
    },
    showCni: {
      type:     Boolean,
      required: true
    },
    showCloudProvider: {
      type:     Boolean,
      required: true
    },
    cloudProviderOptions: {
      type:     Array,
      required: true
    },

    originalIngressController: {
      type:     [String, Array],
      required: false,
      default:  INGRESS_NONE
    },

    previousKubeVersion: {
      type:    String,
      default: undefined
    }
  },

  data() {
    return {
      showEnablingComplianceWarning: false,
      initialAgentProfile:           this.value.agentConfig?.profile || ''
    };
  },

  watch: {
    'agentConfig.profile'(newValue) {
      this.showEnablingComplianceWarning = this.provider === 'custom' && this.isEdit && !!newValue && newValue !== this.initialAgentProfile;
    }
  },

  computed: {
    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },

    showCniNoneBanner() {
      return this.serverConfig?.cni === 'none';
    },

    showBandwidthManagerControl() {
      return this.serverConfig?.cni === 'cilium' || this.serverConfig?.cni === 'multus,cilium';
    },

    showNetworkPolicyWarningBanner() {
      return this.serverConfig?.cni === 'cilium' && this.value?.spec?.enableNetworkPolicy;
    },

    agentConfig() {
      return this.value.agentConfig;
    },

    profileOptions() {
      const out = (this.agentArgs?.profile?.options || []).map((x) => {
        return { label: x, value: x };
      });

      out.unshift({
        label: this.$store.getters['i18n/t']('cluster.rke2.complianceProfile.option'),
        value: ''
      });

      return out;
    },
    ingressController: {
      get() {
        if (this.serverConfig) {
          if (this.serverConfig[INGRESS_CONTROLLER]) {
            return this.serverConfig[INGRESS_CONTROLLER];
          } else {
            if (this.serverConfig.disable && this.serverConfig.disable.includes(RKE2_INGRESS_NGINX)) {
              return INGRESS_NONE;
            }
          }
        }

        return INGRESS_NGINX;
      },

      set(neu) {
        this.serverConfig[INGRESS_CONTROLLER] = neu;
      },
    },

    /**
     * Allow to display override if PSA is needed and profile is set
     */
    hasComplianceOverride() {
      return (this.serverConfig?.profile || this.agentConfig?.profile) &&
        // Also check other cases on when to display the override
        this.showComplianceProfile && this.isComplianceSupported;
    },

    /**
     * Disable PSA if Compliance hardening is enabled, except override
     */
    isPsaDisabled() {
      const complianceValue = this.agentConfig?.profile || this.serverConfig?.profile;

      return !(!complianceValue || this.complianceOverride) && this.isComplianceSupported;
    },

    /**
     * Get the default label for the PSA template option
     */
    defaultPsaOptionLabel() {
      const optionCase = !this.value.isK3s ? 'default' : 'none';

      return this.$store.getters['i18n/t'](`cluster.rke2.defaultPodSecurityAdmissionConfigurationTemplateName.option.${ optionCase }`);
    },

    /**
     * Convert PSA templates into options, sorting and flagging if any selected
     */
    psaOptions() {
      const out = [{
        label: this.defaultPsaOptionLabel,
        value: ''
      }];

      if ( this.allPsas ) {
        for ( const psa of this.allPsas ) {
          out.push({
            label: psa.nameDisplay,
            value: psa.id,
          });
        }
      }
      const cur = this.value.spec.defaultPodSecurityAdmissionConfigurationTemplateName;

      if ( cur && !out.find((x) => x.value === cur) ) {
        out.unshift({ label: `${ cur } (Current)`, value: cur });
      }

      return out;
    },

    /**
     * Check if current compliance profile is required and listed in the options
     */
    isComplianceSupported() {
      const complianceProfile = this.serverConfig?.profile || this.agentConfig?.profile;

      return !complianceProfile || this.profileOptions.map((option) => option.value).includes(complianceProfile);
    },

    disableOptions() {
      // For RKE2 clusters Ingress is configured separately, so we should not allow disabling it here
      return (this.serverArgs.disable.options || []).filter((value) => value !== RKE2_INGRESS_NGINX && value !== RKE2_TRAEFIK).map((value) => {
        return {
          label: this.$store.getters['i18n/withFallback'](`cluster.${ this.value.isK3s ? 'k3s' : 'rke2' }.systemService."${ value }"`, null, value.replace(/^(rke2|rancher)-/, '')),
          value,
        };
      });
    },
    nginxSupported() {
      if (Object.keys(this.serverArgs).length === 0 || this.serverArgs?.disable?.options.includes(RKE2_INGRESS_NGINX)) {
        return true;
      }

      return false;
    },
    // If version is too old and we couldn't get serverArgs, it has to be NGINX
    traefikSupported() {
      return Object.keys(this.serverArgs).length > 0;
    },

    serverArgs() {
      return this.selectedVersion?.serverArgs || {};
    },

    agentArgs() {
      return this.selectedVersion?.agentArgs || {};
    },

    /**
     * The addons (kube charts) applicable for the selected kube version
     *
     * { [chartName:string]: { repo: string, version: string } }
     */
    chartVersions() {
      return this.selectedVersion?.charts || {};
    },

    showComplianceProfile() {
      return (this.provider === 'custom' || this.isElementalCluster) && ( this.serverArgs?.profile || this.agentArgs?.profile );
    },

    enabledSystemServices: {
      get() {
        const out = difference(this.serverArgs.disable.options, this.serverConfig.disable || []);

        return out;
      },

      set(neu) {
        const out = difference(this.serverArgs.disable.options, neu);

        this.$emit('enabled-system-services-changed', out);
      },
    },

    showCloudConfigYaml() {
      if ( !this.agentArgs['cloud-provider-name'] ) {
        return false;
      }

      const name = this.agentConfig?.['cloud-provider-name'];

      if ( !name ) {
        return false;
      }

      switch ( name ) {
      case 'none': return false;
      case 'aws': return false;
      case 'rancher-vsphere': return false;
      case HARVESTER: return false;
      default: return true;
      }
    },

    showVsphereNote() {
      if ( !this.agentArgs['cloud-provider-name'] ) {
        return false;
      }

      const name = this.agentConfig?.['cloud-provider-name'];

      return name === 'rancher-vsphere';
    },

    ciliumBandwidthManager: {
      get() {
        // eslint-disable-next-line no-unused-vars
        const cni = this.serverConfig.cni; // force this property to recalculate if cni was changed away from cilium and chartValues['rke-cilium'] deleted

        return this.userChartValues[this.chartVersionKey('rke2-cilium')]?.bandwidthManager?.enabled || false;
      },
      set(neu) {
        const name = this.chartVersionKey('rke2-cilium');
        const values = this.userChartValues[name];

        const ciliumValues = {
          ...values,
          bandwidthManager: {
            ...values?.bandwidthManager,
            enabled: neu
          }
        };

        this.$emit('cilium-values-changed', ciliumValues);
      }
    },

    nginxChart() {
      return this.chartVersionKey(RKE2_INGRESS_NGINX);
    },
    traefikChart() {
      return this.chartVersionKey(RKE2_TRAEFIK);
    },

    /**
     * Display warning about additional configuration needed for cloud provider Amazon if kube >= 1.27
     */
    showCloudProviderAmazonAdditionalConfigWarning() {
      return !!semver.gte(this.value.spec.kubernetesVersion, 'v1.27.0') && this.agentConfig?.['cloud-provider-name'] === 'aws';
    },

    showIngress() {
      return !this.value?.isK3s;
    },

    showArgInfoWarning() {
      return !this.haveArgInfo || ((!this.nginxChart || !this.traefikChart) && this.showIngress);
    }
  },

  methods: {
    set,

    chartVersionKey(name) {
      const addonVersion = this.addonVersions.find((av) => av.name === name);

      return addonVersion ? `${ name }-${ addonVersion.version }` : name;
    },
    get,
  },
};
</script>

<template>
  <RcContentGroup>
    <Banner
      v-if="showArgInfoWarning"
      color="warning"
      :label="t('cluster.banner.haveArgInfo')"
    />
    <Banner
      v-if="isHarvesterDriver && isHarvesterIncompatible && showCloudProvider"
      color="warning"
    >
      <span
        v-clean-html="t('cluster.harvester.warning.cloudProvider.incompatible', null, true)"
      />
    </Banner>
    <Banner
      v-if="showCloudProviderAmazonAdditionalConfigWarning"
      color="warning"
    >
      <span v-clean-html="t('cluster.banner.cloudProviderAddConfig', {}, true)" />
    </Banner>
    <Banner
      v-if="showCniNoneBanner"
      color="warning"
      data-testid="clusterBasics__noneOptionSelectedForCni"
    >
      <span v-clean-html="t('cluster.rke2.cni.cniNoneBanner', {}, true)" />
    </Banner>

    <div class="input-row">
      <LabeledSelect
        v-model:value="value.spec.kubernetesVersion"
        :mode="mode"
        :options="versionOptions"
        data-testid="clusterBasics__kubernetesVersions"
        label-key="cluster.kubernetesVersion.label"
        class="half"
        @update:value="$emit('kubernetes-changed', $event)"
      />
    </div>
    <Checkbox
      :value="showDeprecatedPatchVersions"
      :mode="mode"
      :label="t('cluster.kubernetesVersion.deprecatedPatches')"
      description-key="cluster.kubernetesVersion.deprecatedPatchWarning"
      @update:value="$emit('show-deprecated-patch-versions-changed', $event)"
    />

    <div
      v-if="showCloudProvider && agentConfig"
      class="input-row"
    >
      <LabeledSelect
        v-model:value="agentConfig['cloud-provider-name']"
        data-testid="clusterBasics__cloudProvider"
        :mode="mode"
        :options="cloudProviderOptions"
        :label="t('cluster.rke2.cloudProvider.label')"
        class="half"
      />
    </div>
    <Banner
      v-if="showVsphereNote"
      color="warning"
      label-key="cluster.cloudProvider.rancher-vsphere.note"
    />
    <RcSection
      v-else-if="showCloudConfigYaml && agentConfig"
      type="secondary"
      mode="with-header"
      :expandable="true"
      :title="t('cluster.rke2.cloudProvider.header')"
    >
      <YamlEditor
        ref="yaml"
        v-model:value="agentConfig['cloud-provider-config']"
        :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
        initial-yaml-values="# Cloud Provider Config"
        class="yaml-editor"
      />
    </RcSection>

    <template v-if="showCni">
      <div class="input-row">
        <LabeledSelect
          v-model:value="serverConfig.cni"
          data-testid="cluster-rke2-cni-select"
          :mode="mode"
          :disabled="isEdit"
          :options="serverArgs.cni.options"
          :label="t('cluster.rke2.cni.label')"
          class="half"
        />
      </div>
      <Checkbox
        v-if="showBandwidthManagerControl"
        v-model:value="ciliumBandwidthManager"
        data-testid="cluster-rke2-cni-cilium-bandwidth-manager-checkbox"
        :mode="mode"
        :label="t('cluster.rke2.cni.cilium.BandwidthManager.enable')"
      />
    </template>

    <RcSection
      type="secondary"
      mode="with-header"
      :expandable="true"
      :title="t('cluster.rke2.security.header')"
    >
      <Banner
        v-if="showComplianceProfile && !isComplianceSupported && isEdit"
        color="info"
      >
        <p v-clean-html="t('cluster.rke2.banner.complianceUnsupported', {profile: serverConfig.profile || agentConfig.profile}, true)" />
      </Banner>

      <template v-if="showComplianceProfile">
        <div
          v-if="serverArgs && serverArgs.profile && serverConfig"
          class="input-row"
        >
          <LabeledSelect
            v-model:value="serverConfig.profile"
            :mode="mode"
            :options="profileOptions"
            :label="t('cluster.rke2.compliance.sever')"
            class="half"
            @update:value="$emit('compliance-changed')"
          />
        </div>
        <div
          v-else-if="agentArgs && agentArgs.profile && agentConfig"
          class="input-row"
        >
          <LabeledSelect
            v-model:value="agentConfig.profile"
            data-testid="rke2-custom-edit-compliance-agent"
            :mode="mode"
            :options="profileOptions"
            :label="t('cluster.rke2.compliance.agent')"
            class="half"
            @update:value="$emit('compliance-changed')"
          />
        </div>
        <Banner
          v-if="showEnablingComplianceWarning"
          color="warning"
          label-key="cluster.rke2.compliance.warning"
        />
      </template>

      <template v-if="hasComplianceOverride">
        <Checkbox
          :value="complianceOverride"
          :mode="mode"
          :label="t('cluster.rke2.compliance.override')"
          @update:value="$emit('psa-default-changed')"
        />

        <Banner
          v-if="complianceOverride"
          color="warning"
          :label="t('cluster.rke2.banner.complianceOverride')"
        />
        <Banner
          v-if="!complianceOverride"
          color="info"
          :label="t('cluster.rke2.banner.psaChange')"
        />
      </template>

      <div class="input-row">
        <LabeledSelect
          :key="value.isK3s"
          v-model:value="value.spec.defaultPodSecurityAdmissionConfigurationTemplateName"
          :mode="mode"
          data-testid="rke2-custom-edit-psa"
          :options="psaOptions"
          :disabled="isPsaDisabled"
          :label="t('cluster.rke2.defaultPodSecurityAdmissionConfigurationTemplateName.label')"
          class="half"
        />
      </div>

      <Checkbox
        v-if="serverArgs['secrets-encryption']"
        v-model:value="serverConfig['secrets-encryption']"
        :mode="mode"
        :label="t('cluster.rke2.secretEncryption.label')"
      />
      <Checkbox
        v-model:value="value.spec.enableNetworkPolicy"
        :mode="mode"
        :label="t('cluster.rke2.enableNetworkPolicy.label')"
      />
      <Banner
        v-if="showNetworkPolicyWarningBanner"
        color="info"
        :label="t('cluster.rke2.enableNetworkPolicy.warning')"
      />
    </RcSection>

    <RcSection
      v-if="serverArgs.disable"
      type="secondary"
      mode="with-header"
      :expandable="true"
      :expanded="false"
      :title="t('cluster.rke2.systemService.header')"
    >
      <div class="system-services">
        <Checkbox
          v-for="(opt, i) in disableOptions"
          :key="i"
          v-model:value="enabledSystemServices"
          :mode="mode"
          :label="opt.label"
          :value-when-true="opt.value"
        />
      </div>
    </RcSection>

    <Ingress
      v-if="showIngress"
      v-model:value="ingressController"
      :mode="mode"
      :nginx-supported="nginxSupported"
      :traefik-supported="traefikSupported"
      :nginx-chart="nginxChart"
      :traefik-chart="traefikChart"
      :user-chart-values="userChartValues"
      :version-info="versionInfo"
      :original-ingress-controller="originalIngressController"
      :kubernetes-version="value.spec.kubernetesVersion"
      :previous-kube-version="previousKubeVersion"
      @update-values="(name, val) => $emit('update-values', name, val)"
      @error="$emit('error', $event)"
      @yaml-validation-changed="e => $emit('yaml-validation-changed', e)"
      @config-validation-changed="e => $emit('config-validation-changed', e)"
    />
  </RcContentGroup>
</template>

<style lang="scss" scoped>
  .system-services {
    display: flex;
    flex-direction: column;
  }
</style>
