<script>
import { RadioGroup } from '@components/Form/Radio';
import RcEtcdSnapshotConfig from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/RcEtcdSnapshotConfig.vue';
import { RcContentGroup } from '@components/Layout';

export default {
  emits: ['s3-backup-changed', 'config-etcd-expose-metrics-changed', 'etcd-validation-changed'],

  components: {
    RadioGroup,
    RcEtcdSnapshotConfig,
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
    selectedVersion: {
      type:     Object,
      required: true,
    },

    s3Backup: {
      type:     Boolean,
      required: false,
      default:  false
    },
    registerBeforeHook: {
      type:     Function,
      required: true,
    },
  },

  computed: {
    etcd() {
      return this.value.spec.rkeConfig.etcd;
    },
    argsEtcdExposeMetrics() {
      return !!this.selectedVersion?.serverArgs?.['etcd-expose-metrics'];
    },
    configEtcdExposeMetrics() {
      return !!this.value.spec.rkeConfig.machineGlobalConfig['etcd-expose-metrics'];
    },
  },
  methods: {
    etcdChanged(neu) {
      const rkeConfig = this.value.spec.rkeConfig;

      rkeConfig.etcd = neu;
    }
  }
};
</script>

<template>
  <RcContentGroup>
    <RcEtcdSnapshotConfig
      :value="etcd"
      :mode="mode"
      :s3-backup="s3Backup"
      :namespace="value.metadata.namespace"
      :register-before-hook="registerBeforeHook"
      @update:value="etcdChanged"
      @s3-backup-changed="$emit('s3-backup-changed', $event)"
      @validation-changed="$emit('etcd-validation-changed', $event)"
    />

    <RadioGroup
      v-if="argsEtcdExposeMetrics"
      :value="configEtcdExposeMetrics"
      name="etcd-expose-metrics"
      :options="[false, true]"
      :label="t('cluster.rke2.etcd.exportMetric.label')"
      :labels="[t('cluster.rke2.etcd.exportMetric.false'), t('cluster.rke2.etcd.exportMetric.true')]"
      :mode="mode"
      @update:value="$emit('config-etcd-expose-metrics-changed', $event)"
    />
  </RcContentGroup>
</template>
