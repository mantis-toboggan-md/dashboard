import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { k3kProvisioner } from './provisioner';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  // plugin.addProduct(require('./product'));

    // Register custom provisioner object
    plugin.register('provisioner', k3kProvisioner.ID, k3kProvisioner);
}
