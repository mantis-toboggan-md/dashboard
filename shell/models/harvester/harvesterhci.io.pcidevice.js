import SteveModel from '@shell/plugins/steve/steve-class';
import { mockBlankPt } from '~/mock-data/picpt-generator';
import { HCI } from '~/shell/config/types';
import { escapeHtml } from '~/shell/utils/string';

const STATUS_DISPLAY = {
  enabled: {
    displayKey: 'generic.enabled',
    color:      'bg-success'
  },
  pending: {
    displayKey: 'generic.inProgress',
    color:      'bg-info'
  },
  disabled: {
    displayKey: 'generic.disabled',
    color:      'bg-warning'
  },
  error: {
    displayKey: 'generic.disabled',
    color:      'bg-warning'
  }
};
// fake some delay in mocking enablement
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

  get passthroughClaim() {
    // TODO actually do
    // const passthroughClaims = this.$getters['all'](HCI.PCI_PASSTHROUGH) || []
    // return passthroughClaims.find(req => req?.spec?.nodeSystemUUID === this.node?.systemUUID);
    return this._pt;
  }

  get isEnabled() {
    return !!this.passthroughClaim?.status?.passthroughEnabled;
  }

  get claimStatusDisplay() {
    if (!this.passthroughClaim) {
      return STATUS_DISPLAY.disabled;
    }
    if (this.isEnabled) {
      return STATUS_DISPLAY.enabled;
    }

    return STATUS_DISPLAY.pending;
  }

  get stateDisplay() {
    const t = this.$rootGetters['i18n/t'];

    return t(this.claimStatusDisplay.displayKey);
  }

  get stateBackground() {
    return this.claimStatusDisplay.color;
  }

  // 'enable' passthrough creates the passthrough request CRD -
  /* async */ enablePassthrough() {
    // TODO actually do
    // const pt = await this.$dispatch(`cluster/create`, { type: HCI.PCI_PASSTHROUGH, name: this.metadata.name }, { root: true });
    const pt = mockBlankPt();

    pt.spec = { pciAddress: this.status.address, nodeSystemUUID: this.status.node.systemUUID };
    pt.status = { passthroughEnabled: false };

    this._pt = pt;
    // fake enablement success within variable length of time
    const enableTime = Math.random() * (ENABLE_TIME[1] - ENABLE_TIME[0]) + ENABLE_TIME[0];

    setTimeout(() => {
      this._pt.status.passthroughEnabled = true;
    }, enableTime);

    return this._pt;
    // return pt.save();
  }

  // group device list by node
  get groupByNode() {
    const name = this.status?.node?.name || this.$rootGetters['i18n/t']('generic.none');

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.node', { name: escapeHtml(name) });
  }

  // group device list by device
  // (each instance of a type of device has its own pciDevice CR)
  get groupByDevice() {
    return this.status.description;
  }
}
