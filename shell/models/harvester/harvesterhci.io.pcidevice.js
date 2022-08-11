import SteveModel from '@shell/plugins/steve/steve-class';
import { mockBlankPt } from '~/mock-data/picpt-generator';
import { HCI } from '~/shell/config/types';
const ENABLED_STATUS = 'Succeeded';
const PROGRESS_STATUS = 'InProgress';
const DISABLED_STATUS = 'Disabled';
const ERROR_STATUS = 'Failed';

const STATUS_DISPLAY = {
  [ENABLED_STATUS]: {
    display: 'Enabled',
    color:   'bg-success'
  },
  [PROGRESS_STATUS]: {
    display: 'In Progress',
    color:   'bg-info'
  },
  [DISABLED_STATUS]: {
    display: 'Disabled',
    color:   'bg-warning'
  },
  [ERROR_STATUS]: {
    display: 'Failed to Enable',
    color:   'bg-error'
  }
};

const ENABLE_TIME = [500, 4000];

/**
 * Class representing Cluster resource.
 * @extends SteveModal
 */
export default class PCIDevice extends SteveModel {
  // TODO get through store instead
  _pt = null;

  get _availableActions() {
    const out = super._availableActions;

    out.push(
      {
        action:     'enablePassthrough',
        enabled:    !this.isEnabled,
        icon:       'icon icon-fw icon-gear',
        label:      'Enable PCI Passthrough',
        bulkable: true
      },
    );

    return out;
  }

  get passthroughRequest() {
    // TODO actually do
    // const passthroughRequests = this.$getters['all'](HCI.PCI_PASSTHROUGH) || []
    // return passthroughRequests.find(req => req?.spec?.nodeSystemUUID === this.node?.systemUUID);
    return this._pt;
  }

  get requestStatus() {
    return this.passthroughRequest?.status?.result || DISABLED_STATUS;
  }

  get stateDisplay() {
    return STATUS_DISPLAY[this.requestStatus].display;
  }

  get stateBackground() {
    return STATUS_DISPLAY[this.requestStatus].color;
  }

  get isEnabled() {
    return this.requestStatus === ENABLED_STATUS;
  }

  // 'enable' passthrough creates the passthrough request CRD -
  /* async */ enablePassthrough() {
    console.log('enabling pt for ', this.metadata.name);
    // TODO actually do
    // const pt = await this.$dispatch(`cluster/create`, { type: HCI.PCI_PASSTHROUGH, name: this.metadata.name }, { root: true });
    const pt = mockBlankPt();

    pt.spec = { pciAddress: this.status.address, nodeSystemUUID: this.status.node.systemUUID };
    pt.status = { result: PROGRESS_STATUS };

    this._pt = pt;
    // fake enablement success within variable length of time
    const enableTime = Math.random() * (ENABLE_TIME[1] - ENABLE_TIME[0]) + ENABLE_TIME[0];

    setTimeout(() => {
      this._pt.status.result = ENABLED_STATUS;
    }, enableTime);

    return this._pt;
    // return pt.save();
  }
}
