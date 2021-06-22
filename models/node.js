import Vue from 'vue';
import { formatPercent } from '@/utils/string';
import { CAPI as CAPI_ANNOTATIONS, NODE_ROLES, RKE } from '@/config/labels-annotations.js';
import { CAPI, METRIC, POD } from '@/config/types';
import { parseSi } from '@/utils/units';
import { PRIVATE } from '@/plugins/steve/resource-proxy';
import findLast from 'lodash/findLast';

/****************************************************
 * Note - this is a kube node, not a norman node
 ****************************************************/

export default {
  _availableActions() {
    const cordon = {
      action:     'cordon',
      enabled:    this.hasLink('update') && this.isWorker && !this.isCordoned,
      icon:       'icon icon-fw icon-pause',
      label:      'Cordon',
      total:      1,
      bulkable:   true
    };

    const uncordon = {
      action:     'uncordon',
      enabled:    this.hasLink('update') && this.isWorker && this.isCordoned,
      icon:       'icon icon-fw icon-play',
      label:      'Uncordon',
      total:      1,
      bulkable:   true
    };

    const openSsh = {
      action:     'openSsh',
      enabled:    !!this.provisionedMachine?.links?.shell,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'SSH Shell',
    };

    const downloadKeys = {
      action:     'downloadKeys',
      enabled:    !!this.provisionedMachine?.links?.sshkeys,
      icon:       'icon icon-fw icon-download',
      label:      'Download SSH Key',
    };

    return [
      openSsh,
      downloadKeys,
      { divider: true },
      cordon,
      uncordon,
      { divider: true },
      ...this._standardActions
    ];
  },

  openSsh() {
    return () => {
      this.provisionedMachine.openSsh();
    };
  },

  downloadKeys() {
    return () => {
      this.provisionedMachine.downloadKeys();
    };
  },

  showDetailStateBadge() {
    return true;
  },

  name() {
    return this.metadata.name;
  },

  internalIp() {
    const addresses = this.status?.addresses || [];

    return findLast(addresses, address => address.type === 'InternalIP')?.address;
  },

  externalIp() {
    const addresses = this.status?.addresses || [];
    const annotationAddress = this.metadata.annotations[RKE.EXTERNAL_IP];
    const statusAddress = findLast(addresses, address => address.type === 'ExternalIP')?.address;

    return statusAddress || annotationAddress;
  },

  labels() {
    return this.metadata?.labels || {};
  },

  isWorker() {
    return `${ this.labels[NODE_ROLES.WORKER] }` === 'true';
  },

  isControlPlane() {
    if (
      `${ this.labels[NODE_ROLES.CONTROL_PLANE] }` === 'true' ||
      `${ this.labels[NODE_ROLES.CONTROL_PLANE_OLD] }` === 'true'
    ) {
      return true;
    }

    return false;
  },

  isEtcd() {
    const { ETCD: etcd } = NODE_ROLES;

    return `${ this.labels[etcd] }` === 'true';
  },

  hasARole() {
    const roleLabelKeys = Object.values(NODE_ROLES);

    return Object.keys(this.labels)
      .some((labelKey) => {
        const hasRoleLabel = roleLabelKeys.includes(labelKey);
        const isExpectedValue = `${ this.labels[labelKey] }` === 'true';

        return hasRoleLabel && isExpectedValue;
      });
  },

  roles() {
    const { isControlPlane, isWorker, isEtcd } = this;

    if (( isControlPlane && isWorker && isEtcd ) ||
        ( !isControlPlane && !isWorker && !isEtcd )) {
      // !isControlPlane && !isWorker && !isEtcd === RKE?
      return 'All';
    }
    // worker+cp, worker+etcd, cp+etcd

    if (isControlPlane && isWorker) {
      return 'Control Plane, Worker';
    }

    if (isControlPlane && isEtcd) {
      return 'Control Plane, Etcd';
    }

    if (isEtcd && isWorker) {
      return 'Etcd, Worker';
    }

    if (isControlPlane) {
      return 'Control Plane';
    }

    if (isEtcd) {
      return 'Etcd';
    }

    if (isWorker) {
      return 'Worker';
    }
  },

  version() {
    return this.status.nodeInfo.kubeletVersion;
  },

  cpuUsage() {
    return parseSi(this.$rootGetters['cluster/byId'](METRIC.NODE, this.id)?.usage?.cpu || '0');
  },

  cpuCapacity() {
    return parseSi(this.status.allocatable.cpu);
  },

  cpuUsagePercentage() {
    return ((this.cpuUsage * 100) / this.cpuCapacity).toString();
  },

  ramUsage() {
    return parseSi(this.$rootGetters['cluster/byId'](METRIC.NODE, this.id)?.usage?.memory || '0');
  },

  ramCapacity() {
    return parseSi(this.status.capacity.memory);
  },

  ramUsagePercentage() {
    return ((this.ramUsage * 100) / this.ramCapacity).toString();
  },

  podUsage() {
    return calculatePercentage(this.status.allocatable.pods, this.status.capacity.pods);
  },

  podConsumedUsage() {
    return ((this.podConsumed / this.podCapacity) * 100).toString();
  },

  podCapacity() {
    return Number.parseInt(this.status.capacity.pods);
  },

  podConsumed() {
    return this.runningPods.length;
  },

  isPidPressureOk() {
    return this.isCondition('PIDPressure', 'False');
  },

  isDiskPressureOk() {
    return this.isCondition('DiskPressure', 'False');
  },

  isMemoryPressureOk() {
    return this.isCondition('MemoryPressure', 'False');
  },

  isKubeletOk() {
    return this.isCondition('Ready');
  },

  isCordoned() {
    return !!this.spec.unschedulable;
  },

  containerRuntimeVersion() {
    return this.status.nodeInfo.containerRuntimeVersion.replace('docker://', '');
  },

  containerRuntimeIcon() {
    if ( this.status.nodeInfo.containerRuntimeVersion.includes('docker') ) {
      return 'icon-docker';
    }

    return '';
  },

  cordon() {
    return async() => {
      Vue.set(this.spec, 'unschedulable', true);
      await this.save();
    };
  },

  uncordon() {
    return async() => {
      Vue.set(this.spec, 'unschedulable', false);
      await this.save();
    };
  },

  state() {
    if ( !this[PRIVATE].isDetailPage && this.isCordoned ) {
      return 'cordoned';
    }

    return this.metadata?.state?.name || 'unknown';
  },

  details() {
    const details = [
      {
        label:    this.t('node.detail.detailTop.version'),
        content:  this.version
      },
      {
        label:    this.t('node.detail.detailTop.os'),
        content:  this.status.nodeInfo.osImage
      },
      {
        label:         this.t('node.detail.detailTop.containerRuntime'),
        formatter:     'IconText',
        formatterOpts: { iconClass: this.containerRuntimeIcon },
        content:       this.containerRuntimeVersion
      }];

    if (this.internalIp) {
      details.unshift({
        label:         this.t('node.detail.detailTop.internalIP'),
        formatter:     'CopyToClipboard',
        content:       this.internalIp
      });
    }

    if (this.externalIp) {
      details.unshift({
        label:         this.t('node.detail.detailTop.externalIP'),
        formatter:     'CopyToClipboard',
        content:       this.externalIp
      });
    }

    return details;
  },

  pods() {
    const allPods = this.$rootGetters['cluster/all'](POD);

    return allPods.filter(pod => pod.spec.nodeName === this.name);
  },

  runningPods() {
    return this.pods.filter(pod => pod.isRunning);
  },

  confirmRemove() {
    return true;
  },

  // You need to preload CAPI.MACHINEs to use this
  provisionedMachine() {
    const namespace = this.metadata?.annotations?.[CAPI_ANNOTATIONS.CLUSTER_NAMESPACE];
    const name = this.metadata?.annotations?.[CAPI_ANNOTATIONS.MACHINE_NAME];

    if ( namespace && name ) {
      return this.$rootGetters['management/byId'](CAPI.MACHINE, `${ namespace }/${ name }`);
    }
  },

};

function calculatePercentage(allocatable, capacity) {
  const c = Number.parseFloat(capacity);
  const a = Number.parseFloat(allocatable);
  const percent = (((c - a) / c) * 100);

  return formatPercent(percent);
}
