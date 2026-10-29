<script>
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import { RcContentGroup } from '@components/Layout';
import { mapGetters } from 'vuex';

const DEFAULTS = {
  deleteEmptyDirData:              true, // Show; Kill pods using emptyDir volumes and lose the data
  disableEviction:                 false, // Hide; false = evict pods, true = delete pods
  enabled:                         false, // Show; true = Nodes must be drained before upgrade; false = YOLO
  force:                           false, // Show; true = Delete standalone pods, false = fail if there are any
  gracePeriod:                     -1, // Show; Pod shut down time, negative value uses pod default
  ignoreDaemonSets:                true, // Hide; true = work, false = never work because there's always daemonSets
  skipWaitForDeleteTimeoutSeconds: 0, // Hide; If the pod deletion time is older than this > 0, don't wait, for some reason
  timeout:                         120, // Show; Give up after this many seconds
};

export default {
  emits: ['update:value'],

  components: {
    RadioGroup, Checkbox, UnitInput, RcContentGroup
  },
  props: {
    value: {
      type:    Object,
      default: () => {},
    },

    mode: {
      type:     String,
      required: true,
    },

    // rke2 or k3s, selects the cluster configuration reference page
    distro: {
      type:    String,
      default: 'rke2',
    },

    // anchor of the drain nodes heading for this node role on that page
    docsAnchor: {
      type:    String,
      default: '_upgrade_strategy',
    },
  },

  data() {
    return {
      deleteEmptyDirData:              DEFAULTS.deleteEmptyDirData,
      disableEviction:                 DEFAULTS.disableEviction,
      enabled:                         DEFAULTS.enabled,
      force:                           DEFAULTS.force,
      gracePeriod:                     DEFAULTS.gracePeriod,
      ignoreDaemonSets:                DEFAULTS.ignoreDaemonSets,
      skipWaitForDeleteTimeoutSeconds: DEFAULTS.skipWaitForDeleteTimeoutSeconds,
      timeout:                         DEFAULTS.timeout,
    };
  },

  created() {
    for ( const k in DEFAULTS ) {
      if ( typeof this.value[k] === 'undefined' ) {
        this.$data[k] = DEFAULTS[k];
      } else {
        this.$data[k] = this.value[k];
      }
    }

    this.customGracePeriod = this.gracePeriod >= 0;
    this.customTimeout = this.timeout >= 0;

    this.update();
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    update() {
      const out = {};

      for ( const k in DEFAULTS ) {
        out[k] = this[k];
      }

      if ( !this.customGracePeriod ) {
        out.gracePeriod = -1;
      }

      if ( !this.customTimeout ) {
        out.timeout = 0;
      }

      this.$emit('update:value', out);
    },
  },
};
</script>

<template>
  <RcContentGroup>
    <RadioGroup
      v-model:value="enabled"
      name="enabled"
      :options="[false, true]"
      :label="t('cluster.rke2.drain.label')"
      :labels="[t('generic.no'), t('generic.yes')]"
      :mode="mode"
      @update:value="update"
    >
      <template #label>
        <h4 class="mmb-1">
          {{ t('cluster.rke2.drain.label') }}
        </h4>
        <t
          k="cluster.rke2.drain.description"
          :distro="distro"
          :anchor="docsAnchor"
          raw
          class="text-deemphasized"
        />
      </template>
    </RadioGroup>

    <template v-if="enabled">
      <Checkbox
        v-model:value="deleteEmptyDirData"
        :mode="mode"
        label-key="cluster.rke2.drain.deleteEmptyDir.label"
        description-key="cluster.rke2.drain.deleteEmptyDir.tooltip"
        @update:value="update"
      />
      <Checkbox
        v-model:value="force"
        :mode="mode"
        label-key="cluster.rke2.drain.force.label"
        description-key="cluster.rke2.drain.force.tooltip"
        @update:value="update"
      />
      <Checkbox
        v-model:value="customGracePeriod"
        :mode="mode"
        label-key="cluster.rke2.drain.gracePeriod.checkboxLabel"
        @update:value="update"
      />
      <div
        v-if="customGracePeriod"
        class="input-row"
      >
        <UnitInput
          v-model:value="gracePeriod"
          :mode="mode"
          label-key="cluster.rke2.drain.gracePeriod.inputLabel"
          :suffix="t('suffix.seconds', {count: timeout})"
          class="half"
          @update:value="update"
        />
      </div>
      <Checkbox
        v-model:value="customTimeout"
        :mode="mode"
        label-key="cluster.rke2.drain.timeout.checkboxLabel"
        @update:value="update"
      />
      <div
        v-if="customTimeout"
        class="input-row"
      >
        <UnitInput
          v-model:value="timeout"
          :mode="mode"
          label-key="cluster.rke2.drain.timeout.inputLabel"
          :suffix="t('suffix.seconds', {count: timeout})"
          class="half"
          @update:value="update"
        />
      </div>
    </template>
  </RcContentGroup>
</template>
