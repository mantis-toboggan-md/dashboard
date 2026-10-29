<script>
import RcPrivateRegistry from '@shell/components/form/RcPrivateRegistry.vue';
import { RcSection } from '@components/RcSection';
import { RcContentGroup } from '@components/Layout';
import RegistryConfigs from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryConfigs';
import RegistryMirrors from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryMirrors';

export default {
  emits:      ['custom-registry-changed', 'registry-host-changed', 'registry-secret-changed', 'input', 'update-configs-changed', 'registry-validation-changed'],
  components: {
    RcPrivateRegistry,
    RcSection,
    RcContentGroup,
    RegistryConfigs,
    RegistryMirrors
  },

  props: {
    registerBeforeHook: {
      type:     Function,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    showCustomRegistryInput: {
      type:     Boolean,
      required: true,
    },

    registryHost: {
      type:     String,
      required: false,
      default:  null
    },

    registrySecret: {
      type:     String,
      required: false,
      default:  null
    },

    showCustomRegistryAdvancedInput: {
      type:     Boolean,
      required: true,
    }
  },

  computed: {
    registryDocsUrl() {
      return this.value.isK3s ? 'https://docs.k3s.io/installation/private-registry' : 'https://docs.rke2.io/install/private_registry';
    }
  }
};
</script>

<template>
  <RcContentGroup>
    <RcSection
      type="secondary"
      mode="with-header"
      :expandable="true"
      :title="t('cluster.privateRegistry.header')"
    >
      <RcPrivateRegistry
        :value="registryHost"
        :enabled="showCustomRegistryInput"
        :mode="mode"
        :pull-secret="registrySecret"
        :register-before-hook="registerBeforeHook"
        checkbox-test-id="registries-enable-checkbox"
        input-test-id="registry-host-input"
        @update:value="$emit('registry-host-changed', $event)"
        @update:enabled="$emit('custom-registry-changed', $event)"
        @update:pull-secret="$emit('registry-secret-changed', $event)"
      />
    </RcSection>
    <RcSection
      type="secondary"
      mode="with-header"
      :expandable="true"
      :expanded="showCustomRegistryAdvancedInput"
      :title="t('registryMirror.header')"
      data-testid="registries-mirrors-section"
    >
      <RegistryMirrors
        :value="value"
        :mode="mode"
        :docs-url="registryDocsUrl"
        @update:value="$emit('input', $event)"
      />
    </RcSection>
    <RcSection
      type="secondary"
      mode="with-header"
      :expandable="true"
      :expanded="showCustomRegistryAdvancedInput"
      :title="t('registryConfig.header')"
      data-testid="registries-advanced-section"
    >
      <RegistryConfigs
        :value="value"
        :mode="mode"
        :docs-url="registryDocsUrl"
        :cluster-register-before-hook="registerBeforeHook"
        @update:value="$emit('input', $event)"
        @updateConfigs="$emit('update-configs-changed', $event)"
        @validation-changed="$emit('registry-validation-changed', $event)"
      />
    </RcSection>
  </RcContentGroup>
</template>
