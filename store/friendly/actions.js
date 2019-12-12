import { SCHEMA } from '@/config/types';
import { createYaml } from '@/utils/create-yaml';
import {
  _VIEW, _EDIT, _CLONE, _STAGE,
  EDIT_YAML, _FLAGGED, _CREATE
} from '@/config/query-params';
import { clone, get } from '~/utils/object';
import { cleanForNew } from '~/plugins/norman/normalize';
import { TO_FRIENDLY, FRIENDLY } from '~/config/friendly';

export default {

  async init({ commit, rootGetters, dispatch }, { ctx }) {
    const { params, route } = ctx;
    let { resource:type } = params;
    const { namespace, id } = params;

    if (!TO_FRIENDLY[type]) {
      type = FRIENDLY[type].type;
    }
    const schema = rootGetters['cluster/schemaFor'](type);
    const data = { type, apiVersion: 'v1' };
    const { path } = route;

    // sometimes mode is query oaram, sometimes route, sometimes not there at all
    let realMode = route.query.mode;
    const modes = [_CREATE, _EDIT, _VIEW, _CLONE, _STAGE];

    if (!realMode) {
      realMode = path.slice((path.lastIndexOf('/') + 1));
    }
    if (!modes.includes(realMode)) {
      realMode = _VIEW;
    }

    // clear any previous CRU page info from state
    commit('cleanState');
    // commit(`${ type }/cleanState`, null, { root: true });
    let fqid = id;

    if ( schema.attributes.namespaced ) {
      fqid = `${ namespace }/${ fqid }`;
    }
    let resourceInstance;
    let progenitor = {};

    switch (realMode) {
    case 'create':
      resourceInstance = await dispatch('createNew', { data, fqid });
      break;
    case 'edit':
      resourceInstance = await dispatch('stageForEdit', { data, fqid });
      break;
    case 'clone':
      progenitor = await dispatch('createClone', { data, fqid });
      resourceInstance = clone(progenitor);
      resourceInstance = cleanForNew(resourceInstance);
      break;
    case 'view':
      resourceInstance = await dispatch('stageForEdit', { data, fqid });
      break;
    }
    commit('updateResourceInstance', { resourceInstance, progenitor });

    let mode = realMode;

    if ( realMode === _STAGE || realMode === _CLONE ) {
      mode = _CREATE;
    }
    const asYaml = route.query[EDIT_YAML] === _FLAGGED;

    const payload = {
      mode,
      realMode,
      routeName:   route.name,
      routeParams: route.params,
      type,
      namespace,
      asYaml,
    };

    commit('init', payload);
  },

  createNew({ dispatch, commit }, { data, fqid }) {
    return dispatch('cluster/create', data, { root: true });
  },
  stageForEdit({ dispatch, commit }, { data, fqid }) {
    return dispatch('cluster/find', { type: data.type, id: fqid }, { root: true });
  },
  createClone({ dispatch, commit }, { data, fqid }) {
    return dispatch('cluster/find', { type: data.type, id: fqid }, { root: true });
  },

  async getYaml({
    state, commit, rootGetters, dispatch
  }) {
    let yaml;
    const mode = state.realMode;

    if (mode === _EDIT ) {
      // const link = state.resourceInstance.hasLink('rioview') ? 'rioview' : 'view';
      const link = viewLink(state.resourceInstance);
      const opt = { url: link, headers: { accept: 'application/yaml' } };

      yaml = (await dispatch('cluster/request', opt, { root: true } )).data;
    } else if (mode === _CLONE) {
      const link = viewLink(state.progenitor);
      const opt = { url: link, headers: { accept: 'application/yaml' } };

      yaml = (await dispatch('cluster/request', opt, { root: true } )).data;
    } else {
      const schemas = rootGetters['cluster/all'](SCHEMA);
      const schema = rootGetters['cluster/schemaFor'](state.type);
      const data = { type: state.type };

      if ( schema.attributes.namespaced ) {
        data.metadata = { namespace: state.namespace };
      }

      yaml = createYaml(schemas, state.type, state.resourceInstance);
    }

    commit('init', { yaml });
  }
};

const viewLink = (resource) => {
  const links = get(resource, 'links');

  return links.rioview ? links.rioview : links.view;
};
