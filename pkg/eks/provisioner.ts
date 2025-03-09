import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruEKS from './components/CruEKS.vue';
import { mapDriver } from '@shell/store/plugins';
import { Component } from 'vue';
import { MANAGEMENT } from '@shell/config/types';

export class EKSProvisioner implements IClusterProvisioner {
  // static ID = 'amazoneks'
  static ID = 'EKS'

  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, 'aws' );
  }

  get id(): string {
    return EKSProvisioner.ID;
  }

  get icon(): any {
    return require('./assets/amazoneks.svg');
  }

  get group(): string {
    return 'kontainer';
  }

  get label(): string {
    return this.context.t('eks.label');
  }

  get component(): Component {
    return CruEKS;
  }

  get hidden(): boolean {
    const kontainerDriver = this.context.getters['management/byId'](MANAGEMENT.KONTAINER_DRIVER, 'amazonelasticcontainerservice');

    return !kontainerDriver?.spec?.active;
  }

  get detailTabs(): any {
    return {
      // registration is conditionally rendered by the provisioning cluster detail component; the other 3 are generic k8s resource tabs
      registration: true,
      related:      true,
      events:       true,
      conditions:   true,

      // exclude rke2 specific tabs
      // a node pool tab is added in ./index.ts
      machines:  false,
      logs:      false,
      snapshots: false,
    };
  }

  get showImport(): boolean {
    return true;
  }
}
