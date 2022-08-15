<script>
export default {
  props: {
    /**
     * deviceId/vendorId is unique per type of device - there may be multiple pciDevice CRD objects for a given device
     * {
     *  [deviceId/vendorId]: {
     *      nodes: array of devicecrd.status.node's for given device,
     *      deviceCRDs: array of all instances (pciDevice CRD) of given device
     *      }
     * }
     */
    uniqueDevices: {
      type:     Object,
      required: true
    },
    /**
 * {
 * [systemUUID]:{
 *      name: node name,
 *      devices: array of all pciDevice CRD referencing this node (all pci devices on node)
 *      }
 * }
 */
    devicesByNode: {
      type:     Object,
      required: true
    }
  },

  computed: {
    allNodeIds() {
      return Object.keys(this.devicesByNode);
    },

    allDeviceIds() {
      return Object.keys(this.uniqueDevices);
    }
  },

  methods: {
    deviceNameFromId(id) {
      return (this.uniqueDevices[id]?.deviceCRDs || [])[0]?.status?.description;
    },

    nodeNameFromId(id) {
      return this.devicesByNode[id]?.name;
    },

    nodeHasDevice(nodeId, deviceId) {
      const allNodesWithDevice = this.uniqueDevices[deviceId]?.nodes;

      return !!allNodesWithDevice.find(node => node.systemUUID === nodeId);
    },
  }
};
</script>

<template>
  <div class="compat-matrix">
    <div class="device-col node-names">
      <div class="blank-corner" />
      <div v-for="nodeId in allNodeIds" :key="nodeId" class="node-label">
        <span>  {{ nodeNameFromId(nodeId) }}</span>
      </div>
    </div>
    <div v-for="deviceId in allDeviceIds" :key="deviceId" class="device-col">
      <div v-tooltip="deviceNameFromId(deviceId)" class="compat-cell device-label">
        {{ deviceId }}
      </div>
      <div
        v-for="nodeId in allNodeIds"
        :key="nodeId"
        class="compat-cell"
        :class="{'has-device': nodeHasDevice(nodeId, deviceId) }"
      />
    </div>
  </div>
</template>

<style lang='scss'>
.compat-matrix {
    display: flex;
}

.device-col {
    display: flex;
    flex-direction: column;

    border-right: 1px solid var(--border);

    &>*{
        border-bottom: 1px solid var(--border);
    }
}

.compat-cell {
    flex-basis: 1em;
    padding: 0px 10px 0px 10px;

    &.has-device {
        background-color: var(--accent-btn);
    }
}

.node-label, .device-label {
    display: flex;
    align-items: center;
    color: var(--input-label);
}

.node-label{
    justify-content: flex-end;
}

.node-label, .device-label, .compat-cell, .blank-corner {
    flex-basis: calc(1em + 10px);
}
</style>
