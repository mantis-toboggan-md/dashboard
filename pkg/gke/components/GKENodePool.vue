<script lang="ts">
import { PropType, defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import { _CREATE } from '@shell/config/query-params';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

import { imageTypes } from '../util/gcp';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

export default defineComponent({
  name: 'GKENodePool',

  components: {
    Checkbox, LabeledSelect, LabeledInput
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    clusterKubernetesVersion: {
      type:    String,
      default: ''
    },

    // TODO nb add type for labeledselect options
    machineTypeOptions: {
      type:    Array as PropType<{label: string, kind?: string, value?: string, disabled?: boolean, [key: string]: any}[]>,
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
    },

    machineType: {
      type:    String,
      default: ''
    },

    diskType: {
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
    },

    clusterKubernetesVersion: {
      handler(neu) {
        if (neu && this.mode === _CREATE) {
          this.$emit('update:version', neu);
        }
      },
      immediate: true
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

    diskTypeOptions() {
      return [
        {
          label: this.t('gke.diskType.standard'),
          value: 'pd-standard',
        },
        {
          label: this.t('gke.diskType.ssd'),
          value: 'pd-ssd',
        }
      ];
    },

    selectedImageType: {
      get() {
        return this.imageTypeOptions.find((opt) => opt.value === this.imageType) || { value: this.imageType, label: this.t(`gke.imageType.${ this.imageType }`, null, this.imageType) };
      },
      set(neu: {label: string, kind?: string, value?: string, disabled?: boolean, [key: string]: any}) {
        this.$emit('update:imageType', neu.value);
      }
    },

    selectedMachineType: {
      get(): {label: string, kind?: string, value?: string, disabled?: boolean, [key: string]: any}| undefined {
        return this.machineTypeOptions.find((opt) => opt?.value === this.machineType);
      },
      set(neu: {label: string, kind?: string, value?: string, disabled?: boolean, [key: string]: any}) {
        this.$emit('update:machineType', neu.value);
      }
    },

    selectedDiskType: {
      get() {
        return this.diskTypeOptions.find((opt) => opt.value === this.diskType);
      },
      set(neu) {
        this.$emit('update:diskType', neu.value);
      }
    }
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
          :label="t('gke.version.upgrade', {clusterVersion: clusterKubernetesVersion})"
        />
        <div
          v-else
        >
          <LabeledInput
            label-key="gke.version.label"
            :value="version"
            disabled
          />
        </div>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          :value="selectedImageType"
          :mode="mode"
          :options="imageTypeOptions"
          label-key="gke.imageType.label"
          @selecting="selectedImageType=$event"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          :mode="mode"
          :options="machineTypeOptions"
          :loading="loadingMachineTypes"
          :value="selectedMachineType"
          label-key="gke.machineType.label"
          @selecting="selectedMachineType = $event"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <LabeledSelect
          :mode="mode"
          :options="diskTypeOptions"
          :value="selectedDiskType"
          @selecting="selectedDiskType=$event"
        />
      </div>
    </div>
  </div>
</template>
