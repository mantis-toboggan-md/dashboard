import { RESOURCE_QUOTA } from '@/config/types';
import { get, isEmpty } from '@/utils/object';
import { _EDIT } from '~/config/query-params';

export default {
  populateResourceFields({
    state, rootState, commit, dispatch
  }) {
    // commit('cleanState');
    const namespaceInstance = rootState.friendly.resourceInstance;
    const progenitor = rootState.friendly.progenitor;

    console.log('populate state with: ', namespaceInstance);

    // find default resource quota if it exists
    dispatch('findDefaultQuota', { namespaceInstance, progenitor });
    commit('populateResourceFields', { namespaceInstance, progenitor });
  },

  async findDefaultQuota({ commit, dispatch, rootState }, { namespaceInstance, progenitor }) {
    const name = !!get(progenitor, 'metadata.name') ? progenitor.metadata.name : get(namespaceInstance, 'metadata.name') || '';
    const ID = `${ name }/default-quota`;
    let quota;
    let quotaMode = 'create';

    try {
      quota = await dispatch('cluster/find', { type: RESOURCE_QUOTA, id: ID }, { root: true });
      if (quota) {
        quotaMode = rootState.friendly.mode === _EDIT ? 'edit' : 'create';
      }
    } catch {
      quota = await dispatch('cluster/create', { type: RESOURCE_QUOTA }, { root: true });
    }
    commit('populateQuotaFields', {
      quota, mode: rootState.friendly.realMode, quotaMode
    });
  },

  createQuota({ state, dispatch, getters }, url) {
    if ( state.quotaChanged && state.quotaMode !== 'create') {
      dispatch('updateQuota');
    } else if (state.quotaChanged) {
      const metadata = { name: `default-quota` };

      const hard = getters.hard;

      if (isEmpty(hard)) {
        return;
      }
      const data = { metadata, spec: { hard } };

      dispatch('cluster/request', {
        url:    `${ url }/resourcequotas`, data, method: 'POST'
      }, { root: true } );
    }
  },

  updateQuota({
    state, rootState, dispatch, getters
  }) {
    const toUpdate = getters.quotaToUpdate;
    let method = 'PUT';

    if (isEmpty(getters.hard)) {
      method = 'DELETE';
    }

    dispatch('cluster/request', {
      url:    toUpdate.links.update, data:   toUpdate, method
    }, { root: true } );
  },
};
