import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';
import { AKSProvisioner } from './provisioner';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register custom provisioner object
  plugin.register('provisioner', AKSProvisioner.ID, AKSProvisioner);

  // Built-in icon
  plugin.metadata.icon = require('./icon.svg');

  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    {
      resource: ['provisioning.cattle.io.cluster'],
      context:  { provider: AKSProvisioner.ID }
    },
    {
      name:       'aks-nodes',
      labelKey:   'aks.nodePools.title',
      weight:     99,
      showHeader: true,
      component:  () => import('./components/NodeGroupDetail.vue')
    }
  );
}
