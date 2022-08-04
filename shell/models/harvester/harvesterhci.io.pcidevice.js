import SteveModel from '@shell/plugins/steve/steve-class';
import { mockPCIPassthroughs } from '~/mock-data/generator';
const passthroughRequests = mockPCIPassthroughs();
const ENABLED_STATUS = 'Succeeded';
const ENABLED_DISPLAY = 'enabled';
const DISABLED_DUSPLAY = 'disabled';

/**
 * Class representing Cluster resource.
 * @extends SteveModal
 */
export default class ProvCluster extends SteveModel {
  get availableActions() {
    const out = super._availableActions;

    out.push([
      {
        action:     'enablePassthrough',
        enabled:    !this.isEnabled,
        icon:       'icon icon-fw icon-circle-plus',
        label:      'Enable PCI Passthrough',
        bulkable: true
      },
    ]);

    return out;
  }

  get passthroughRequest() {
    return passthroughRequests.find(req => req?.spec?.nodeSystemUUID === this.node?.systemUUID);
  }

  get stateDisplay() {
    return this.passthroughRequest?.status?.result === ENABLED_STATUS ? ENABLED_DISPLAY : DISABLED_DUSPLAY;
  }

  get isEnabled() {
    return this.stateDisplay === ENABLED_DISPLAY;
  }
}
