import SteveModel from '@shell/plugins/steve/steve-class';
import { NAME } from '@shell/config/product/settings';

export class Resourceview extends SteveModel {
  // TODO nb get global setting
  // resource views are stored in a global setting, 'resourceviews'
  get setting() {
    return {};
  }

  get canYaml() {
    return false;
  }

  get canEditYaml() {
    return false;
  }

  // TODO nb this should be dependent on this.setting.canUpdate
  get canUpdate() {
    return true;
  }

  get canCustomEdit() {
    return true;
  }

  get _detailLocation() {
    // TODO use constant for spoofed type
    return {
      name:   'c-cluster-product-resource-id',
      params: {
        product: NAME, resource: 'resourceview', id: this.id
      }
    };
  }

  testFunction() {
    console.log('test function please ignore');
  }
}
