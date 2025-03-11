import { MANAGEMENT_NODE } from '@shell/config/labels-annotations';
import {
  ADDRESSES, CAPI, MANAGEMENT, NODE, NORMAN
} from '@shell/config/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { listNodeRoles } from '@shell/models/cluster/node';
import { insertAt } from '@shell/utils/array';
import { downloadUrl } from '@shell/utils/download';
import findLast from 'lodash/findLast';
import HybridModel from '@shell/plugins/steve/hybrid-class';
import { notOnlyOfRole } from '@shell/models/cluster.x-k8s.io.machine';

export default class MgmtNode extends HybridModel {
  get _availableActions() {
    const out = super._availableActions;

    const downloadKeys = {
      action:  'downloadKeys',
      enabled: !!this.norman?.links?.nodeConfig,
      icon:    'icon icon-fw icon-download',
      label:   this.t('node.actions.downloadNodeConfig'),
    };

    const scaleDown = {
      action:     'scaleDown',
      bulkAction: 'scaleDown',
      enabled:    !!this.canScaleDown,
      icon:       'icon icon-minus icon-fw',
      label:      this.t('node.actions.scaleDown'),
      bulkable:   true,
    };

    const normanAction = this.norman?.actions || {};

    const drain = {
      action:     'drain',
      enabled:    !!normanAction.drain,
      icon:       'icon icon-fw icon-dot-open',
      label:      this.t('drainNode.action'),
      bulkable:   true,
      bulkAction: 'drain'
    };

    const stopDrain = {
      action:   'stopDrain',
      enabled:  !!normanAction.stopDrain,
      icon:     'icon icon-fw icon-x',
      label:    this.t('drainNode.actionStop'),
      bulkable: true,
    };

    const cordon = {
      action:   'cordon',
      enabled:  !!normanAction.cordon,
      icon:     'icon icon-fw icon-pause',
      label:    'Cordon',
      total:    1,
      bulkable: true
    };

    const uncordon = {
      action:   'uncordon',
      enabled:  !!normanAction.uncordon,
      icon:     'icon icon-fw icon-play',
      label:    'Uncordon',
      total:    1,
      bulkable: true
    };

    insertAt(out, 0, { divider: true });
    insertAt(out, 0, downloadKeys);
    insertAt(out, 0, scaleDown);

    insertAt(out, 0, drain);
    insertAt(out, 0, stopDrain);

    insertAt(out, 0, uncordon);
    insertAt(out, 0, cordon);

    return out;
  }

  get state() {
    if (this.drainedState) {
      return this.drainedState;
    }

    if ( this.isCordoned ) {
      return 'cordoned';
    }

    return this.metadata?.state?.name || 'unknown';
  }

  get drainedState() {
    const sNodeCondition = this.status.conditions.find((c) => c.type === 'Drained');

    if (sNodeCondition) {
      if (sNodeCondition.status === 'True') {
        return 'drained';
      }
      if (sNodeCondition.transitioning) {
        return 'draining';
      }
    }

    return null;
  }

  get kubeNodeName() {
    return this.metadata.labels[MANAGEMENT_NODE.NODE_NAME];
  }

  get mgmtClusterId() {
    return this.id.substring(0, this.id.indexOf('/'));
  }

  get kubeNodeDetailLocation() {
    return this.kubeNodeName ? {
      name:   'c-cluster-product-resource-id',
      params: {
        cluster:  this.mgmtClusterId,
        product:  EXPLORER,
        resource: NODE,
        id:       this.kubeNodeName
      }
    } : null;
  }

  get isWorker() {
    return this.spec.worker;
  }

  get isControlPlane() {
    return this.spec.controlPlane;
  }

  get isEtcd() {
    return this.spec.etcd;
  }

  get roles() {
    const { isControlPlane, isWorker, isEtcd } = this;

    return listNodeRoles(isControlPlane, isWorker, isEtcd, this.t('generic.all'));
  }

  get pool() {
    const nodePoolID = this.spec.nodePoolName.replace(':', '/');

    return this.$rootGetters['management/byId'](MANAGEMENT.NODE_POOL, nodePoolID);
  }

  get norman() {
    const id = this.id.replace('/', ':');

    return this.$rootGetters['rancher/byId'](NORMAN.NODE, id);
  }

  get canDelete() {
    return this.norman?.hasLink('remove');
  }

  get canUpdate() {
    return this.hasLink('update') && this.norman?.hasLink('update');
  }

  get isCordoned() {
    return !!this.norman.unschedulable;
  }

  remove() {
    return this.norman?.remove();
  }

  downloadKeys() {
    const url = this.norman?.links?.nodeConfig;

    if ( url ) {
      downloadUrl(url);
    }
  }

  async scaleDown(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component:  'ScaleMachineDownDialog',
      modalWidth: '450px'
    });
  }

  async cordon(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node.norman?.doAction('cordon');
    }));
  }

  async uncordon(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node.norman?.doAction('uncordon');
    }));
  }

  drain(resources) {
    this.$dispatch('promptModal', {
      component:      'DrainNode',
      componentProps: {
        kubeNodes:    resources || [this],
        normanNodeId: this.normanNodeId
      }
    });
  }

  async stopDrain(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node.norman?.doAction('stopDrain');
    }));
  }

  get provisioningCluster() {
    return this.$getters['all'](CAPI.RANCHER_CLUSTER).find((c) => c.mgmtClusterId === this.mgmtClusterId);
  }

  get doneOverride() {
    return this.provisioningCluster?.detailLocation;
  }

  get canClone() {
    return false;
  }

  get addresses() {
    return this.status?.addresses || this.status?.internalNodeStatus?.addresses || [];
  }

  get internalIp() {
    // This shows in the IP address column for RKE1 nodes in the
    // list of nodes in the cluster detail page of Cluster Management.
    const internal = this.addresses.find(({ type }) => {
      return type === ADDRESSES.INTERNAL_IP;
    });

    if (internal) {
      return internal.address;
    }

    // For RKE1 clusters in EC2, node addresses are
    // under status.rkeNode.address and status.rkeNode.internalAddress
    if (!internal && this.status.rkeNode) {
      return this.status.rkeNode.internalAddress;
    }

    return this.t('generic.none');
  }

  get externalIp() {
    const statusAddress = findLast(this.addresses, (address) => address.type === 'ExternalIP')?.address;

    if (statusAddress) {
      return statusAddress;
    }

    // For RKE1 clusters in EC2, node addresses are
    // under status.rkeNode.address and status.rkeNode.internalAddress
    if (!statusAddress && this.status.rkeNode) {
      return this.status.rkeNode.address;
    }

    return this.t('generic.none');
  }

  get canScaleDown() {
    const hasAction = this.norman?.actions?.scaledown;

    if (!this.isEtcd && !this.isControlPlane && hasAction) {
      return true;
    }

    return hasAction && notOnlyOfRole(this, this.provisioningCluster?.nodes);
  }
}
