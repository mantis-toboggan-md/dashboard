<script>
import provisioners from './provisioner-params';
import RadioGroup from '@/components/form/RadioGroup';
import Checkbox from '@/components/form/Checkbox';
import { ZONE, REGION } from '@/config/labels-annotations';

export default {
  components: {
    RadioGroup,
    Checkbox,
  },

  props:      {
    provisioner: {
      type:    String,
      default: ''
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: ''
    }
  },

  data() {
    const {
      volumeBindingMode = 'Immediate', allowVolumeExpansion = false, reclaimPolicy = 'Delete', allowedTopologies = {}
    } = this.value;

    const { matchLabelExpressions = [] } = allowedTopologies;
    const zones = [];
    const regions = [];

    matchLabelExpressions.forEach((pair) => {
      if (pair.key === ZONE) {
        zones.push(...pair.values);
      } else if (pair.key === REGION) {
        regions.push(...pair.values);
      }
    });

    return {
      volumeBindingMode, allowVolumeExpansion, specifyTopology: false, reclaimPolicy, zones, regions
    };
  },

  computed: {
    config() {
      return provisioners[this.provisioner] || {};
    },

    labels() {
      return { zone: ZONE, region: REGION };
    }
  },

  methods: {
    addToList(list) {
      if (list === ZONE) {
        this.zones.push('');
      } else {
        this.regions.push('');
      }
    },

    removeFromList(list, index) {
      if (list === ZONE) {
        this.zones.splice(index, 1);
      } else {
        this.regions.splice(index, 1);
      }
    },

    update() {
      this.$nextTick(() => {
        const out = {
          ...this.value,
          reclaimPolicy: this.reclaimPolicy
        };

        if (this.config._waitForFirstConsumer) {
          out.volumeBindingMode = this.volumeBindingMode;
        } else {
          delete out.volumeBindingMode;
        }

        if (this.config._allowVolumeExpansion) {
          out.allowVolumeExpansion = this.allowVolumeExpansion;
        } else {
          delete out.allowVolumeExpansion;
        }

        if (this.config._allowedTopologies && !!this.specifyTopology) {
          out.allowedTopologies = {
            matchLabelExpressions: [
              { key: ZONE, values: this.zones },
              { key: REGION, values: this.regions }
            ]
          };
        } else {
          delete out.allowedTopologies;
        }

        this.$emit('input', out);
      });
    }
  }
};
</script>

<template>
  <div @input="update" @click="update">
    <div class="row">
      <RadioGroup
        v-model="reclaimPolicy"
        class="col span-6"
        label="Reclaim Policy"
        :options="['Delete', 'Retain']"
        :labels="['Delete volumes and underlying device when volume claim is deleted', ' Retain the volume for manual cleanup']"
      />
      <RadioGroup
        v-if="config._waitForFirstConsumer"
        v-model="volumeBindingMode"
        class="col span-6"
        label="Volume Binding Mode"
        :options="['Immediate', 'waitForFirstConsumer']"
        :labels="['Bind and provision a persistent volume once the PersistentVolumeClaim is created', 'Bind and provision a persistent volume once a Pod using the PersistentVolumeClaim is created']"
      />
    </div>
    <hr />
    <div class="row">
      <Checkbox
        v-if="config._allowedTopologies"
        v-model="specifyTopology"
        class="col span-6"
        label="Restrict provisioning to specific pods"
      />
      <Checkbox
        v-if="config._allowVolumeExpansion"
        v-model="allowVolumeExpansion"
        class="col span-6"
        label="Allow Volume Expansion"
      />
    </div>
    <div v-if="config._allowedTopologies">
      <div v-if="specifyTopology" class="row">
        <div class="zone col span-6">
          <div class="mb-10 text-muted">
            {{ labels.zone }}
          </div>
          <div v-for="(zone, i) in zones" :key="zone" class="row mb-5">
            <input :value="zone" type="text" placeholder="e.g. us-east-1d" @input="e=>zones[i]=e.target.value" />
            <button class="btn btn-sm role-link" @click="removeFromList(labels.zone, i)">
              remove
            </button>
          </div>
          <button class="btn btn-sm role-primary" @click="addToList(labels.zone)">
            Add Zone
          </button>
        </div>
        <div class="region col span-6">
          <div class="mb-10 text-muted">
            {{ labels.region }}
          </div>
          <div v-for="(region, i) in regions" :key="region" class="row mb-5">
            <input :value="region" type="text" placeholder="e.g. us-east-1d" @input="e=>regions[i]=e.target.value" />
            <button class="btn btn-sm role-link" @click="removeFromList(labels.region, i)">
              remove
            </button>
          </div>
          <button class="btn btn-sm role-primary" @click="addToList(labels.region)">
            Add Region
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

 <style lang='scss' scoped>
  button.role-link {
    padding-left: 8px
  }
</style>
