import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruGKE from './components/CruGKE.vue';
import { mapDriver } from '@shell/store/plugins';
import { Component } from 'vue';
import { MANAGEMENT } from '@shell/config/types';

export class GKEProvisioner implements IClusterProvisioner {
  // static ID = 'googlegke'
  static ID = 'GKE'

  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, 'gcp' );
  }

  get id(): string {
    return GKEProvisioner.ID;
  }

  get icon(): any {
    return require('./assets/gke.svg');
  }

  get group(): string {
    return 'kontainer';
  }

  get label(): string {
    return this.context.t('gke.label');
  }

  get component(): Component {
    return CruGKE;
  }

  get hidden(): boolean {
    const kontainerDriver = this.context.getters['management/byId'](MANAGEMENT.KONTAINER_DRIVER, 'googlekubernetesengine');

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
