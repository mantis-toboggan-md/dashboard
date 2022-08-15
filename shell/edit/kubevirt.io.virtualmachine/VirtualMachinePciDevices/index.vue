<script>
import { _EDIT } from '@shell/config/query-params';
import { allHash } from '@shell/utils/promise';
import { HCI } from '@shell/config/types';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceTable from '@shell/components/ResourceTable';
import Banner from '@components/Banner/Banner.vue';
import CompatibilityMatrix from '@shell/edit/kubevirt.io.virtualmachine/VirtualMachinePciDevices/CompatibilityMatrix';

import remove from 'lodash/remove';

export default {
  name:       'VirtualMachinePCIDevices',
  components: {
    LabeledSelect,
    ResourceTable,
    CompatibilityMatrix,
    Banner
  },
  props:      {
    mode: {
      type:    String,
      default: _EDIT
    },
    value: {
      type:    Object,
      default: () => {}
    }
  },

  async fetch() {
    const hash = {
      // TODO actually fetch
      // passthroughs fetched here so synchronous pciDevice model property works
      pciDevices: this.$store.dispatch('harvester/findAll', { type: HCI.PCI_DEVICE }),
      // passthroughs: this.$store.dispatch('harvester/findAll', { type: HCI.PCI_PASSTHROUGH }),
    };

    const res = await allHash(hash);

    for (const key in res) {
      this[key] = res[key];
    }
  },

  data() {
    return {
      pciDevices:      [],
      passthroughs:    [],
      selectedDevices: [],
      deviceType:      HCI.PCI_DEVICE,
      pciDeviceSchema: this.$store.getters['harvester/schemaFor'](HCI.PCI_DEVICE),
      showMatrix:      false,
    };
  },

  computed: {
    nodeAffinity() {
      return this.value?.affinity?.nodeAffinity || null;
    },

    // user can only select devices for whcih pci passthrough is enabled - determined by finding the associated passthrough CRD
    enabledDevices() {
      return this.pciDevices.filter(device => device.isEnabled) || [];
    },

    // pciDevice is one per device per node - if multiple nodes have device or multiple devices on a node there will be duplicate deviceID vendorID
    uniqueDevices() {
      const out = {};

      this.enabledDevices.forEach((deviceCRD) => {
        const uniqueId = `${ deviceCRD?.status?.deviceId }:${ deviceCRD?.status?.vendorId }`;
        const deviceNode = deviceCRD?.status?.node;

        if (!out[uniqueId]) {
          out[uniqueId] = {
            nodes:      [deviceNode],
            deviceCRDs: [deviceCRD]
          };
        } else {
          if (!out[uniqueId].nodes.find(node => node?.systemUUID === deviceNode?.systemUUID)) {
            out[uniqueId].nodes.push(deviceNode);
          }
          out[uniqueId].deviceCRDs.push(deviceCRD);
        }
      });

      return out;
    },

    devicesByNode() {
      const out = {};

      for (const deviceUid in this.uniqueDevices) {
        const nodesWithDevice = this.uniqueDevices[deviceUid].nodes;

        nodesWithDevice.forEach((node) => {
          if (!out[node.systemUUID]) {
            out[node.systemUUID] = {
              name:    node.name,
              devices: [deviceUid]
            };
          } else {
            out[node.systemUUID].devices.push(deviceUid);
          }
        });
      }

      return out;
    },

    // determine which nodes contain all devices selected
    compatibleNodes() {
      const out = [...Object.keys(this.devicesByNode)];

      this.selectedDevices.forEach((deviceUid) => {
        remove(out, (nodeId) => {
          const nodesWithDevice = this.uniqueDevices[deviceUid].nodes.map(node => node.systemUUID);

          return !nodesWithDevice.includes(nodeId);
        });
      });

      return out;
    },

    // array of device uids available on compatible nodes
    compatibleDeviceOpts() {
      const out = [];

      for (const deviceUid in this.uniqueDevices) {
        const nodesWithDevice = this.uniqueDevices[deviceUid].nodes.map(node => node.systemUUID);

        if (nodesWithDevice.some(nodeId => this.compatibleNodes.includes(nodeId))) {
          out.push(deviceUid);
        }
      }

      return out;
    },

    allDeviceOpts() {
      return Object.keys(this.uniqueDevices).map((deviceId) => {
        const device = this.uniqueDevices[deviceId].deviceCRDs[0];

        return {
          description: device?.status?.description,
          value:       deviceId,
          label:       deviceId
        };
      });
    },

    deviceListRoute() {
      return {
        name:   'c-cluster-product-resource',
        params: { resource: HCI.PCI_DEVICE }
      };
    }
  },

  methods: {
    nodeNameFromUid(uid) {
      for (const deviceUid in this.uniqueDevices) {
        const nodes = this.uniqueDevices[deviceUid].nodes;
        const thisNode = nodes.find(node => node.systemUUID === uid);

        if (thisNode) {
          return thisNode.name;
        }
      }
    }
  }
};
</script>

<template>
  <div>
    <div v-if="!enabledDevices.length" class="row">
      <div class="col span-12">
        <Banner color="warning">
          <t k="harvester.pci.noDevicesEnabled" /><nuxt-link :to="deviceListRoute">
            {{ t('harvester.pci.deviceListView') }}
          </nuxt-link>
        </Banner>
      </div>
    </div>
    <template v-else>
      <!-- <div v-if="incompatibleDevicesSelected" class="row">
        <div class="col span-12">
          <Banner color="error">
            {{ t('harvester.pci.impossibleSelection') }}
          </Banner>
        </div>
      </div> -->
      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model="selectedDevices"
            label="Available PCI Devices"
            searchable
            multiple
            taggable
            :options="allDeviceOpts"
          >
            <template #option="option">
              <span>{{ option.value }} <span class="text-label">{{ option.description }}</span></span>
            </template>
          </LabeledSelect>
        </div>
      </div>
      <div v-if="compatibleNodes.length && selectedDevices.length" class="row">
        <div class="col span-12 text-muted">
          Compatible hosts:
          <!-- eslint-disable-next-line vue/no-parsing-error -->
          <span v-for="(node, idx) in compatibleNodes" :key="node">{{ nodeNameFromUid(node) }}{{ idx < compatibleNodes.length-1 ? ', ' : '' }}</span>
        </div>
      </div>
      <div v-else-if="selectedDevices.length" class="text-error">
        {{ t('harvester.pci.impossibleSelection') }}
      </div>
      <button type="button" class="btn btn-sm role-link pl-0" @click="e=>{showMatrix = !showMatrix; e.target.blur()}">
        {{ showMatrix ? t('harvester.pci.hideCompatibility') : t('harvester.pci.showCompatibility') }}
      </button>
      <div v-if="showMatrix" class="row mt-20">
        <div class="col span-12">
          <CompatibilityMatrix :unique-devices="uniqueDevices" :devices-by-node="devicesByNode" />
        </div>
      </div>
    </template>
    <!-- <div class="row mt-20">
      <div class="col span-12">
        <ResourceTable :schema="pciDeviceSchema" :resource="deviceType" :rows="pciDevices" />
      </div>
    </div> -->
  </div>
</template>
