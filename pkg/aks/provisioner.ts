import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruAks from './components/CruAks.vue';
import { mapDriver } from '@shell/store/plugins';
import type { Component } from 'vue';
import { MANAGEMENT } from '@shell/config/types';

export class AKSProvisioner implements IClusterProvisioner {
  // static ID = 'azureaks'
  static ID = 'AKS'

  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, 'azure' );
    mapDriver(this.id, 'aks' );
  }

  get id(): string {
    return AKSProvisioner.ID;
  }

  get icon(): any {
    return require('./icon.svg');
  }

  get group(): string {
    return 'kontainer';
  }

  get label(): string {
    return this.context.t('aks.label');
  }

  get component(): Component {
    return CruAks;
  }

  get hidden(): boolean {
    const kontainerDriver = this.context.getters['management/byId'](MANAGEMENT.KONTAINER_DRIVER, 'azurekubernetesservice');

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
