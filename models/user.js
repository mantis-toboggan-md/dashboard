import { insertAt } from '@/utils/array';
import { get, clone } from '~/utils/object';
import { FRIENDLY } from '@/config/friendly';

export default {

  detailUrl() {
    const router = this.currentRouter();
    const schema = this.$getters['schemaFor'](FRIENDLY['users'].type);
    const route = `settings-resource-id`;
    const params = {
      group:     schema.groupName,
      resource:  `users`,
      id:        this.id
    };

    const url = router.resolve({
      name:   route,
      params,
    }).href;

    return url;
  },

  nameDisplay() {
    return this.metadata ? this.metadata.name : this.username;
  },

  _availableActions() {
    const out = this._standardActions;

    insertAt(out, 2, {
      action:     'deactivate',
      label:      'Deactivate',
      icon:       'icon icon-copy',
      enabled:    true,
      bulkable:   true,
      bulkAction: 'deactivateBulk',

    });

    return out;
  },

  deactivate() {
    return async() => {
      console.log('Deactivate user ', this.name);
      const url = get(this, 'links.self');

      const data = clone(this);

      data.enabled = false;
      try {
        await this.$dispatch('cluster/request', {
          url, data, method: 'PUT'
        }, { root: true });
      } catch (err) {
        this.$dispatch('growl/fromError', { title: 'Error deactivating user', err }, { root: true });
      }
    };
  },

  deactivateBulk() {
    return (items) => {
      items.forEach((item) => {
        this.deactivate(item);
      });
    };
  }
}
;
