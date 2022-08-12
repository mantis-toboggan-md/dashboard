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

  data() {
    return {
      hoverNode:   null,
      hoverDevice: null
    };
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
      return (this.uniqueDevices[id]?.deviceCRDs || [])[0]?.metadata?.name;
    },

    nodeNameFromId(id) {
      return this.devicesByNode[id]?.name;
    },

    nodeHasDevice(nodeId, deviceId) {
      const allNodesWithDevice = this.uniqueDevices[deviceId]?.nodes;

      return !!allNodesWithDevice.find(node => node.systemUUID === nodeId);
    },

    setHover(nodeId, deviceId) {
      if (this.hoverNode === this.allNodeIds[this.allNodeIds.indexOf(nodeId) + 1]) {
        this.hoverNode = null;
      }
      if (this.hoverDevice === this.allDeviceIds[this.allDeviceIds.indexOf(deviceId) + 1]) {
        this.hoverDevice = null;
      }
      this.hoverNode = nodeId;
      this.hoverDevice = deviceId;
    },

    endHover(nodeId, deviceId) {
      this.$nextTick(() => {
        if (this.hoverNode === nodeId) {
          this.hoverNode = null;
        }
        if (this.hoverDevice === deviceId) {
          this.hoverDevice = null;
        }
      });
    }
  }
};
</script>

<template>
  <div class="compat-matrix">
    <div class="device-col node-names" :class="{'highlight': allDeviceIds[0]===hoverDevice}">
      <div class="blank-corner" :class="{'highlight': allNodeIds[0]===hoverNode}" />
      <div v-for="(nodeId, i) in allNodeIds" :key="nodeId" class="node-label" :class="{'highlight': hoverNode === nodeId || allNodeIds[i+1]===hoverNode }">
        <span>  {{ nodeNameFromId(nodeId) }}</span>
      </div>
    </div>
    <div v-for="(deviceId, idx) in allDeviceIds" :key="deviceId" class="device-col" :class="{'highlight': hoverDevice === deviceId || allDeviceIds[idx+1]===hoverDevice}">
      <div class="compat-cell device-label" :class="{'highlight': allNodeIds[0]===hoverNode}">
        {{ deviceNameFromId(deviceId) }}
      </div>
      <div
        v-for="(nodeId, i) in allNodeIds"
        :key="nodeId"
        class="compat-cell"
        :class="{'has-device': nodeHasDevice(nodeId, deviceId), 'highlight': hoverNode === nodeId || allNodeIds[i+1]===hoverNode }"
        @mouseover="setHover(nodeId, deviceId)"
        @mouseout="endHover(nodeId, deviceId)"
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
        background-color: var(--primary-banner-bg);
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

.highlight {
    animation-duration: 1s;
    animation-delay: 0.25s;
    animation-fill-mode: forwards;
    animation-name: fadein;
    &.device-col {
        animation-name: fadecol;
        // border-right: 1px solid var(--primary-border)
    }
    &.compat-cell, &.node-label, &.blank-corner{
        animation-name: faderow;
        // border-bottom: 1px solid var(--primary-border)
    }
}

@keyframes fadecol {
    from {
        border-right: 1px solid var(--primary);

    }
    to {
        border-right: 1px solid var(--primary-border);
    }
}

@keyframes faderow {
  from {
        border-bottom: 1px solid var(--primary);

    }
    to {
        border-bottom: 1px solid var(--primary-border);
    }
}

</style>
