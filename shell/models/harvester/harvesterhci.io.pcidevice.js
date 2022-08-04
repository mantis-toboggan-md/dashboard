import SteveModel from '@shell/plugins/steve/steve-class';
import { mockBlankPt } from '~/mock-data/picpt-generator';
import { escapeHtml } from '@shell/utils/string';
import { HCI as HCI_LABELS } from '@shell/config/labels-annotations';

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
 * Class representing PCI Device resource.
 * @extends SteveModal
 */
export default class PCIDevice extends SteveModel {
  // TODO get through store instead
  _pt = null;

  get _availableActions() {
    const out = super._availableActions;

    // TODO translation strings
    out.push(
      {
        action:     'enablePassthrough',
        enabled:    !this.isEnabling,
        icon:       'icon icon-fw icon-dot',
        label:      'Enable Passthrough',
        bulkable: true
      },
      {
        action:     'disablePassthrough',
        enabled:    this.isEnabling && this.claimedByMe,
        icon:       'icon icon-fw icon-dot-open',
        label:      'Disable Passthrough',
        bulkable: true
      },
    );

    return out;
  }

  get passthroughClaim() {
    // TODO actually do
    // const passthroughClaims = this.$getters['all'](HCI.PCI_CLAIM) || []
    // return passthroughClaims.find(req => req?.spec?.nodeSystemUUID === this.node?.systemUUID);
    return this._pt;
  }

  // this is an id for each 'type' of device - there may be multiple instances of device CRs
  get uniqueId() {
    return `${ this.status?.deviceId }:${ this.status?.vendorId }`;
  }

  get claimedBy() {
    return this.passthroughClaim?.spec?.userName;
  }

  get claimedByMe() {
    if (!this.passthroughClaim) {
      return false;
    }
    // TODO use isSingleProduct when pluginized
    const isSingleProduct = this.$rootGetters['isSingleVirtualCluster'];
    let userName = 'admin';

    // if this is imported Harvester, there may be users other than 'admin
    if (!isSingleProduct) {
      userName = this.$rootGetters['auth/v3User']?.username;
    }

    return this.claimedBy === userName;
  }

  // isEnabled controls visibility in vm create page
  // isEnabling controls ability to add/remove a claim
  get isEnabled() {
    return !!this.passthroughClaim?.status?.passthroughEnabled;
  }

  get isEnabling() {
    return !!this.passthroughClaim;
  }

  // used to create node selectors during vm creation
  get nodeLabel() {
    const { vendorId, deviceId } = this.status;

    return `${ HCI_LABELS.PCI_DEVICE }/vendor/${ vendorId }/device/${ deviceId }`;
  }

  // map status.passthroughEnabled to disabled/enabled & overwrite default dash colors
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

  // 'enable' passthrough creates the passthrough claim CRD -
  /* async */ enablePassthrough() {
    // TODO use isSingleProduct when pluginized
    // isSingleProduct == this is a standalone Harvester cluster
    const isSingleProduct = this.$rootGetters['isSingleVirtualCluster'];
    let userName = 'admin';

    // if this is imported Harvester, there may be users other than 'admin
    if (!isSingleProduct) {
      userName = this.$rootGetters['auth/v3User']?.username;
    }

    // TODO actually do
    // const pt = await this.$dispatch(`cluster/create`, { type: HCI.PCI_CLAIM, name: this.metadata.name }, { root: true });
    const pt = mockBlankPt();

    pt.spec = {
      pciAddress: this.status.address, nodeName: this.status.nodeName, userName
    };
    pt.status = { passthroughEnabled: false };

    this._pt = pt;
    // fake enablement success within variable length of time
    const enableTime = Math.random() * (ENABLE_TIME[1] - ENABLE_TIME[0]) + ENABLE_TIME[0];

    setTimeout(() => {
      this._pt.status.passthroughEnabled = true;
    }, enableTime);

    return this._pt;
    // try {
    //  await pt.save();

    // } catch (err) {
    //   this.$dispatch('growl/fromError', {
    //     title: this.$rootGetters['i18n/t']('harvester.pci.claimError', { name: escapeHtml(this.metadata.name) }),
    //     err,
    //   }, { root: true });
    // }
  }

  // 'disable' passthrough deletes claim
  // backend should return error if device is in use
  /* async */ disablePassthrough() {
    try {
      if (!this.claimedByMe) {
        throw new Error(this.$rootGetters['i18n/t']('harvester.pci.cantUnclaim', { name: escapeHtml(this.metadata.name) }));
      } else {
        this._pt = null;
        // TODO actually do
        // return await this.passthroughClaim.remove();
      }
    } catch (err) {
      this.$dispatch('growl/fromError', {
        title: this.$rootGetters['i18n/t']('harvester.pci.unclaimError', { name: escapeHtml(this.metadata.name) }),
        err,
      }, { root: true });
    }
  }

  // group device list by node
  get groupByNode() {
    const name = this.status?.nodeName || this.$rootGetters['i18n/t']('generic.none');

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.node', { name: escapeHtml(name) });
  }

  // group device list by unique device (same vendorid and deviceid)
  get groupByDevice() {
    return this.status.description;
  }
}
