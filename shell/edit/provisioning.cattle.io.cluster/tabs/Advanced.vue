<script>
import { _VIEW } from '@shell/config/query-params';
import { Banner } from '@components/Banner';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import ArrayList from '@shell/components/form/ArrayList';
import { Checkbox } from '@components/Form/Checkbox';
import DirectoryConfig from '@shell/edit/provisioning.cattle.io.cluster/tabs/DirectoryConfig.vue';
import { RcSection } from '@components/RcSection';
import { RcContentGroup } from '@components/Layout';

export default {
  components: {
    Banner,
    ArrayListGrouped,
    MatchExpressions,
    ArrayList,
    Checkbox,
    DirectoryConfig,
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

    haveArgInfo: {
      type:     Boolean,
      required: true
    },

    selectedVersion: {
      type:     Object,
      required: true
    },
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    rkeConfig() {
      return this.value.spec.rkeConfig;
    },
    agentArgs() {
      return this.selectedVersion?.agentArgs || {};
    },
    serverArgs() {
      return this.selectedVersion?.serverArgs || {};
    },
    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },
    agentConfig() {
      return this.value.agentConfig;
    },
    advancedTitleAlt() {
      const machineSelectorLength = this.rkeConfig.machineSelectorConfig.length;

      return this.t('cluster.advanced.argInfo.machineSelector.titleAlt', { count: machineSelectorLength });
    },
    protectKernelDefaults() {
      return (this.agentConfig || this.serverConfig)['protect-kernel-defaults'];
    },
    kubeletArgTooltip() {
      if (this.serverConfig?.['kubelet-arg']) {
        return this.t(`cluster.advanced.argInfo.tooltip.${ this.agentConfig?.['kubelet-arg'] ? 'mixed-args' : 'global-args' }`, null, { raw: true });
      }

      return null;
    }
  },

  methods: {
    selectorTitle({ row, i }) {
      return row.value.machineLabelSelector ? this.t('cluster.advanced.argInfo.machineSelector.itemTitle', { index: i }) : this.advancedTitleAlt;
    },
    canRemoveKubeletRow(row, i) {
      return i !== 0 || !this.agentConfig;
    },
    showEmptyKubeletArg(config) {
      return !this.serverArgs?.['kubelet-arg']?.length && !config?.['kubelet-arg']?.length;
    },
    onInputProtectKernelDefaults(value) {
      if (this.agentConfig && this.agentConfig['protect-kernel-defaults'] !== undefined ) {
        this.agentConfig['protect-kernel-defaults'] = value;
      } else {
        this.serverConfig['protect-kernel-defaults'] = value;
      }
    }
  }
};
</script>

<template>
  <RcContentGroup>
    <Banner
      class="m-0"
      color="info"
      label-key="cluster.jwtAuthentication.banner"
      data-testid="jwt-authentication-banner"
    />
    <template v-if="haveArgInfo">
      <RcSection
        type="secondary"
        mode="with-header"
        :expandable="true"
        :title="t('cluster.directoryConfig.title')"
      >
        <DirectoryConfig
          v-model:value="value.spec.rkeConfig.dataDirectories"
          :k8s-version="value.spec.kubernetesVersion"
          :mode="mode"
        />
      </RcSection>
      <RcSection
        v-if="agentArgs['kubelet-arg']"
        type="secondary"
        mode="with-header"
        :expandable="true"
        :title="t('cluster.advanced.argInfo.title')"
      >
        <span
          v-if="kubeletArgTooltip"
          v-clean-html="kubeletArgTooltip"
          class="text-deemphasized"
        />
        <ArrayListGrouped
          v-model:value="rkeConfig.machineSelectorConfig"
          :mode="mode"
          :add-label="t('cluster.advanced.argInfo.machineSelector.label')"
          :can-remove="canRemoveKubeletRow"
          :default-add-value="{machineLabelSelector: { matchExpressions: [], matchLabels: {} }, config: {'kubelet-arg': []}}"
          :use-rc="true"
          :get-item-title="selectorTitle"
        >
          <template #default="{row, i}">
            <RcContentGroup>
              <template v-if="row.value.machineLabelSelector">
                <MatchExpressions
                  v-model:value="row.value.machineLabelSelector"
                  :mode="mode"
                  :show-remove="false"
                  :initial-empty-row="true"
                  :use-rc="true"
                >
                  <template #header>
                    <h4 class="m-0">
                      {{ t('cluster.advanced.argInfo.machineSelector.title') }}
                    </h4>
                  </template>
                </MatchExpressions>
                <h4 class="m-0">
                  {{ t('cluster.advanced.argInfo.machineSelector.subTitle') }}
                </h4>
              </template>

              <ArrayList
                v-if="i === 0 && serverConfig['kubelet-arg']"
                v-model:value="serverConfig['kubelet-arg']"
                data-testid="global-kubelet-arg"
                :mode="mode"
                :add-label="t('cluster.advanced.argInfo.machineGlobal.listLabel')"
                add-icon="icon-plus"
                use-rc-button
              >
                <template #empty>
                  {{ '' }}
                </template>
              </ArrayList>

              <ArrayList
                v-if="row.value.config && (row.value.config['kubelet-arg'] || !serverConfig['kubelet-arg'])"
                v-model:value="row.value.config['kubelet-arg']"
                data-testid="selector-kubelet-arg"
                :mode="mode"
                :add-label="t('cluster.advanced.argInfo.machineSelector.listLabel')"
                :initial-empty-row="!!row.value.machineLabelSelector"
                add-icon="icon-plus"
                use-rc-button
              >
                <template
                  v-if="i === 0"
                  #empty
                >
                  {{ '' }}
                </template>
              </ArrayList>

              <div
                v-if="i === 0 && isView && showEmptyKubeletArg(row.value.config)"
                class="text-muted"
              >
                &mdash;
              </div>
            </RcContentGroup>
          </template>
        </ArrayListGrouped>
        <Banner
          v-if="rkeConfig.machineSelectorConfig.length > 1"
          color="info"
          class="m-0"
          :label="t('cluster.advanced.argInfo.machineSelector.bannerLabel')"
        />
      </RcSection>

      <RcSection
        v-if="serverArgs['kube-controller-manager-arg']"
        type="secondary"
        mode="with-header"
        :expandable="true"
        :title="t('cluster.advanced.argInfo.machineSelector.kubeControllerManagerTitle')"
      >
        <ArrayList
          v-model:value="serverConfig['kube-controller-manager-arg']"
          :mode="mode"
          add-icon="icon-plus"
          use-rc-button
        />
      </RcSection>
      <RcSection
        v-if="serverArgs['kube-apiserver-arg']"
        type="secondary"
        mode="with-header"
        :expandable="true"
        :title="t('cluster.advanced.argInfo.machineSelector.kubeApiServerTitle')"
      >
        <ArrayList
          v-model:value="serverConfig['kube-apiserver-arg']"
          :mode="mode"
          add-icon="icon-plus"
          use-rc-button
        />
      </RcSection>
      <RcSection
        v-if="serverArgs['kube-scheduler-arg']"
        type="secondary"
        mode="with-header"
        :expandable="true"
        :title="t('cluster.advanced.argInfo.machineSelector.kubeSchedulerTitle')"
      >
        <ArrayList
          v-model:value="serverConfig['kube-scheduler-arg']"
          :mode="mode"
          add-icon="icon-plus"
          use-rc-button
        />
      </RcSection>
    </template>
    <Checkbox
      v-if="agentArgs && agentArgs['protect-kernel-defaults']"
      data-testid="protect-kernel-defaults"
      :value="protectKernelDefaults"
      :mode="mode"
      :label="t('cluster.advanced.agentArgs.label')"
      @update:value="onInputProtectKernelDefaults($event)"
    />
  </RcContentGroup>
</template>
