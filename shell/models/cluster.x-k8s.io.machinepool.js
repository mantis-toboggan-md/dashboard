import SteveModel from '@shell/plugins/steve/steve-class';
import { capiBootstrapDataSecret, relatedEntry } from '@shell/utils/editable-related-resources';

export default class CapiMachinePool extends SteveModel {
  /**
   * The resources related to this machine pool, to edit by YAML alongside it
   *
   * Dependencies: the bootstrap data Secret, see `capiBootstrapDataSecret`. The bootstrap config
   * and infrastructure machine pool are found from the schema, see
   * `fetchReferencedEditableRelatedResources`
   *
   * @param {import('@shell/core/types').EditableRelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources({ dependencies = true } = {}) {
    if (!this.metadata?.uid || !dependencies) {
      return [];
    }

    const secret = await capiBootstrapDataSecret(this, this.spec?.template?.spec, this.metadata.namespace);

    return secret ? [relatedEntry(secret)] : [];
  }
}
