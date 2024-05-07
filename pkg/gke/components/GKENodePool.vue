<script lang="ts">
import { _CREATE } from '@shell/config/query-params';
import { defineComponent } from 'vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

export default defineComponent({
  name: 'GKENodePool',

  components: { Checkbox },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    clusterKubernetesVersion: {
      type:    String,
      default: ''
    },

    version: {
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
    // when initially created nodepools are configured to use the same k8s version as the control plane (clusterKubernetesVersion)
    // on edit, if the cp version is updated, the user is given the option to update each node pool as well
    upgradeAvailable() {
      if (this.mode === _CREATE) {
        return false;
      }

      return this.version !== this.clusterKubernetesVersion;
    }
  }
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
    </div>
  </div>
</template>
