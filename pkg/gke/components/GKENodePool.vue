<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import { _CREATE } from '@shell/config/query-params';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

import { imageTypes } from '../util/gcp';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

export default defineComponent({
  name: 'GKENodePool',

  components: { Checkbox, LabeledSelect },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    clusterKubernetesVersion: {
      type:    String,
      default: ''
    },

    machineTypeOptions: {
      type:    Array,
      default: () => []
    },

    loadingMachineTypes: {
      type:    Boolean,
      default: false
    },

    version: {
      type:    String,
      default: ''
    },

    imageType: {
      type:    String,
      default: ''
    }
  },

  data() {
    return { upgradeKubernetesVersion: false };
  },

  watch: {
    upgradeKubernetesVersion(neu) {
      if (neu) {
        this.$emit('update:version', this.clusterKubernetesVersion);
      }
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/withFallback' }),
    // when initially created nodepools are configured to use the same k8s version as the control plane (clusterKubernetesVersion)
    // on edit, if the cp version is updated, the user is given the option to update each node pool as well
    upgradeAvailable() {
      if (this.mode === _CREATE) {
        return false;
      }

      return this.version !== this.clusterKubernetesVersion;
    },

    imageTypeOptions() {
      return imageTypes.map((type) => {
        return {
          value: type,
          label: this.t(`gke.imageType.${ type }`, null, type)
        };
      });
    },

    selectedImageType: {
      get() {
        return this.imageTypeOptions.find((opt) => opt.value === this.imageType) || { value: this.imageType, label: this.t(`gke.imageType.${ this.imageType }`, null, this.imageType) };
      },
      set(neu) {
        this.$emit('update:imageType', neu.value);
      }
    },
  },
});

</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-3">
        <Checkbox
          v-if="upgradeAvailable"
          v-model="upgradeKubernetesVersion"
          :mode="mode"
        />
        <span v-else>{{ clusterKubernetesVersion }}</span>
      </div>
      <div class="col span-3">
        <LabeledSelect
          :value="selectedImageType"
          :mode="mode"
          :options="imageTypeOptions"
          label-key="gke.imageType.label"
          @selecting="selectedImageType=$event"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <LabeledSelect
          :mode="mode"
          :options="machineTypeOptions"
          :loading="loadingMachineTypes"
        />
      </div>
    </div>
  </div>
</template>
