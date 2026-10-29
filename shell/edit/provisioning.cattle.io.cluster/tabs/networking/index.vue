<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList';
import RcACE from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking/RcACE.vue';
import { RcSection } from '@components/RcSection';
import { RcContentGroup } from '@components/Layout';
import LabeledSelect from '@shell/components/form/LabeledSelect';

const NETBIOS_TRUNCATION_LENGTH = 15;

export const STACK_PREFS = {
  IPV4: 'ipv4',
  IPV6: 'ipv6',
  DUAL: 'dual'
};

export default {
  emits: [
    'update:value', 'cluster-cidr-changed', 'local-cluster-auth-endpoint-changed',
    'service-cidr-changed', 'cluster-domain-changed', 'cluster-dns-changed',
    'truncate-hostname-changed', 'ca-certs-changed', 'service-node-port-range-changed',
    'fqdn-changed', 'tls-san-changed', 'stack-preference-changed', 'validationChanged', 'flannel-ipv6-masq-changed'
  ],

  components: {
    LabeledInput,
    Banner,
    Checkbox,
    ArrayList,
    RcACE,
    RcSection,
    RcContentGroup,
    LabeledSelect
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    selectedVersion: {
      type:     Object,
      required: true,
    },

    truncateLimit: {
      type:     Number,
      required: false,
      default:  0
    },

    hasSomeIpv6Pools: {
      type:    Boolean,
      default: false
    },

    flannelIpv6Masq: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { STACK_PREFS };
  },

  computed: {
    truncateHostnames() {
      return this.truncateLimit === NETBIOS_TRUNCATION_LENGTH;
    },

    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },

    serverArgs() {
      return this.selectedVersion?.serverArgs || {};
    },

    stackPreferenceOptions() {
      return [{
        label: this.t('cluster.rke2.stackPreference.options.ipv4'),
        value: STACK_PREFS.IPV4
      },
      {
        label: this.t('cluster.rke2.stackPreference.options.ipv6'),
        value: STACK_PREFS.IPV6
      }, {
        label: this.t('cluster.rke2.stackPreference.options.dual'),
        value: STACK_PREFS.DUAL
      },
      ];
    },

    hostnameTruncationManuallySet() {
      return !!this.truncateLimit && this.truncateLimit !== NETBIOS_TRUNCATION_LENGTH;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isView() {
      return this.mode === _VIEW;
    },

    localValue: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('update:value', newValue);
      }
    },

    stackPreference: {
      get() {
        return this.localValue.spec?.networking?.stackPreference || STACK_PREFS.DUAL;
      },
      set(neu) {
        if (!this.localValue.spec.networking) {
          this.localValue.spec.networking = {};
        }
        this.localValue.spec.networking.stackPreference = neu;
      }
    },

    isK3s() {
      return (this.selectedVersion?.label || '').includes('k3s');
    },

    // docs path segment for the rke2 or k3s cluster configuration reference
    distro() {
      return this.isK3s ? 'k3s' : 'rke2';
    },

    showFlannelMasq() {
      const flannelEnabled = this.value?.spec?.rkeConfig?.machineGlobalConfig?.['flannel-backend'] !== 'none';

      return this.isK3s && flannelEnabled;
    },

    isIpv6StackPref() {
      return [STACK_PREFS.IPV6, STACK_PREFS.DUAL].includes(this.value?.spec?.rkeConfig?.networking?.stackPreference);
    },

    isIpv6ServerConfig() {
      const clusterCIDR = this.serverConfig['cluster-cidr'] || '';
      const serviceCIDR = this.serverConfig['service-cidr'] || '';

      return clusterCIDR.includes(':') || serviceCIDR.includes(':');
    },

    isProbablyIPv6() {
      return this.hasSomeIpv6Pools || this.isIpv6StackPref || this.isIpv6ServerConfig;
    },
  }
};
</script>

<template>
  <RcContentGroup>
    <RcSection
      type="secondary"
      mode="with-header"
      :expandable="true"
      :title="t('cluster.rke2.address.header')"
    >
      <div>
        <t
          k="cluster.rke2.address.description"
          :distro="distro"
          raw
          class="text-deemphasized"
        />
        <div
          v-if="serverArgs['cluster-cidr'] || serverArgs['service-cidr']"
          class="input-row mmt-1"
        >
          <LabeledInput
            v-if="serverArgs['cluster-cidr']"
            :value="serverConfig['cluster-cidr']"
            :mode="mode"
            :disabled="isEdit"
            :label="t('cluster.rke2.address.clusterCidr.label')"
            data-testid="cluster-cidr"
            @update:value="$emit('cluster-cidr-changed', $event)"
          />
          <LabeledInput
            v-if="serverArgs['service-cidr']"
            :value="serverConfig['service-cidr']"
            :mode="mode"
            :disabled="isEdit"
            :label="t('cluster.rke2.address.serviceCidr.label')"
            data-testid="service-cidr"
            @update:value="$emit('service-cidr-changed', $event)"
          />
        </div>
      </div>

      <div
        v-if="serverArgs['cluster-dns'] || serverArgs['cluster-domain']"
        class="input-row"
      >
        <LabeledInput
          v-if="serverArgs['cluster-dns']"
          :value="serverConfig['cluster-dns']"
          :mode="mode"
          :disabled="isEdit"
          :label="t('cluster.rke2.address.dns.label')"
          @update:value="$emit('cluster-dns-changed', $event)"
        />
        <LabeledInput
          v-if="serverArgs['cluster-domain']"
          :value="serverConfig['cluster-domain']"
          :mode="mode"
          :disabled="isEdit"
          :label="t('cluster.rke2.address.domain.label')"
          @update:value="$emit('cluster-domain-changed', $event)"
        />
      </div>

      <template v-if="serverArgs['service-node-port-range']">
        <div class="input-row">
          <LabeledInput
            :value="serverConfig['service-node-port-range']"
            :mode="mode"
            :label="t('cluster.rke2.address.nodePortRange.label')"
            class="half"
            @update:value="$emit('service-node-port-range-changed', $event)"
          />
        </div>
        <Checkbox
          v-if="!isView || isView && !hostnameTruncationManuallySet"
          :value="truncateHostnames"
          :disabled="isEdit || isView || hostnameTruncationManuallySet"
          :mode="mode"
          :label="t('cluster.rke2.truncateHostnames')"
          data-testid="network-tab-truncate-hostname"
          @update:value="$emit('truncate-hostname-changed', $event)"
        />
        <Banner
          v-if="hostnameTruncationManuallySet"
          color="info"
        >
          <div class="text">
            {{ t('cluster.machinePool.truncationCluster', { limit: truncateLimit }) }}
          </div>
        </Banner>
      </template>

      <ArrayList
        v-if="serverArgs['tls-san']"
        :value="serverConfig['tls-san']"
        :protip="false"
        :mode="mode"
        :title="t('cluster.rke2.address.tlsSan.label')"
        add-icon="icon-plus"
        use-rc-button
        @update:value="$emit('tls-san-changed', $event)"
      />
    </RcSection>

    <RcSection
      type="secondary"
      mode="with-header"
      :expandable="true"
      :title="t('cluster.tabs.ace')"
    >
      <RcACE
        v-model:value="localValue.spec.localClusterAuthEndpoint"
        :mode="mode"
        @fqdn-changed="$emit('fqdn-changed', $event)"
        @ca-certs-changed="$emit('ca-certs-changed', $event)"
        @local-cluster-auth-endpoint-changed="$emit('local-cluster-auth-endpoint-changed', $event)"
      />
    </RcSection>

    <RcSection
      type="secondary"
      mode="with-header"
      :expandable="true"
      :title="t('cluster.rke2.stackPreference.label')"
    >
      <div>
        <t
          k="cluster.rke2.stackPreference.description"
          raw
          class="text-deemphasized"
        />
        <div class="input-row mmt-1">
          <LabeledSelect
            :key="hasSomeIpv6Pools"
            :value="localValue?.spec?.rkeConfig?.networking?.stackPreference || STACK_PREFS.DUAL"
            :mode="mode"
            :options="stackPreferenceOptions"
            data-testid="network-tab-stackpreferences"
            :require-dirty="false"
            class="half"
            @selecting="e=>$emit('stack-preference-changed', e)"
            @update:validation="e=>$emit('validationChanged', e)"
          />
        </div>
      </div>
    </RcSection>

    <RcSection
      v-if="showFlannelMasq"
      type="secondary"
      mode="with-header"
      :expandable="true"
      :title="t('cluster.k3s.flannelMasq.title')"
    >
      <Banner
        v-if="isProbablyIPv6"
        color="warning"
        data-testid="cluster-rke2-flannel-masq-banner"
        :label="t('cluster.k3s.flannelMasq.banner', null, true)"
      />
      <Checkbox
        :value="flannelIpv6Masq"
        data-testid="cluster-rke2-flannel-masq-checkbox"
        :mode="mode"
        :label="t('cluster.k3s.flannelMasq.label')"
        @update:value="e=>$emit('flannel-ipv6-masq-changed', e)"
      />
    </RcSection>
  </RcContentGroup>
</template>
