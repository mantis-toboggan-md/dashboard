<script>
import { get } from '@shell/utils/object';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import { RcSection } from '@components/RcSection';
import { RcContentGroup } from '@components/Layout';
import DrainOptions from '@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade/DrainOptions';

export default {
  components: {
    LabeledInput,
    Banner,
    DrainOptions,
    RcSection,
    RcContentGroup
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
  },

  computed: {
    rkeConfig() {
      return this.value.spec.rkeConfig;
    },

    distro() {
      return this.value.isK3s ? 'k3s' : 'rke2';
    },
  },
  methods: { get }
};
</script>

<template>
  <RcContentGroup>
    <Banner
      v-if="get(rkeConfig, 'upgradeStrategy.controlPlaneDrainOptions.deleteEmptyDirData')"
      color="warning"
    >
      {{ t('cluster.rke2.drain.deleteEmptyDir.warning', {}, true) }}
    </Banner>
    <RcSection
      type="secondary"
      mode="with-header"
      :expandable="true"
      :title="t('cluster.rke2.controlPlaneConcurrency.header')"
    >
      <div>
        <t
          k="cluster.rke2.controlPlaneConcurrency.description"
          :distro="distro"
          raw
          class="text-deemphasized"
        />
        <div class="input-row mmt-1">
          <LabeledInput
            v-model:value="rkeConfig.upgradeStrategy.controlPlaneConcurrency"
            :mode="mode"
            :label="t('cluster.rke2.controlPlaneConcurrency.label')"
            class="half"
          />
        </div>
      </div>
      <DrainOptions
        v-model:value="rkeConfig.upgradeStrategy.controlPlaneDrainOptions"
        :mode="mode"
        :distro="distro"
        docs-anchor="_drain_nodes_control_plane"
      />
    </RcSection>
    <RcSection
      type="secondary"
      mode="with-header"
      :expandable="true"
      :title="t('cluster.rke2.workNode.label')"
    >
      <div>
        <t
          k="cluster.rke2.workerConcurrency.description"
          :distro="distro"
          raw
          class="text-deemphasized"
        />
        <div class="input-row mmt-1">
          <LabeledInput
            v-model:value="rkeConfig.upgradeStrategy.workerConcurrency"
            :mode="mode"
            :label="t('cluster.rke2.workerConcurrency.label')"
            class="half"
          />
        </div>
      </div>
      <DrainOptions
        v-model:value="rkeConfig.upgradeStrategy.workerDrainOptions"
        :mode="mode"
        :distro="distro"
        docs-anchor="_drain_nodes_worker_nodes"
      />
    </RcSection>
  </RcContentGroup>
</template>
