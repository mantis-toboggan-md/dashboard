import { TO_FRIENDLY } from '@/config/friendly';
import { _VIEW, _EDIT } from '@/config/query-params';
import { get } from '~/utils/object';
import { SCHEMA, NAMESPACE } from '~/config/types';
import { createYaml } from '~/utils/create-yaml';

export default {
  isView(state) {
    return state.mode === _VIEW;
  },

  isEdit(state) {
    return state.mode === _EDIT;
  },

  typeDisplay(state) {
    return TO_FRIENDLY[state.type].singular;
  },

  originalName(state) {
    return get(state, 'progenitor.metadata') ? get(state, 'progenitor.metadata.name') : get(state, 'resourceInstance.metadata.name');
  },

  doneRoute(state) {
    const name = state.routeName ? state.routeName.replace(/(-namespace)?-id$/, '') : '';

    return name;
  },

  doneParams(state) {
    return state.routeParams;
  },

  parentLink(state, getters) {
    const name = getters.doneRoute;
    const params = getters.doneParams;
    const out = name + params;

    return out;
  },

  namespaceSuffixOnCreate(state) {
    return state.resource !== NAMESPACE;
  },

  yaml(state, getters, rootState, rootGetters) {
    const schemas = rootGetters['cluster/all'](SCHEMA);

    return createYaml(schemas, state.type, state.resourceInstance);
  },
  fqid(state, getters, rootState, rootGetters) {
    const schema = rootGetters['cluster/schemaFor'](state.type);
    let fqid = state.resourceInstance.id;
    const namespace = get(state.resourceInstance, 'metadata.namespace');

    if ( schema.attributes.namespaced ) {
      fqid = namespace ? `${ namespace }/${ fqid }` : fqid;
    }

    return fqid;
  }
};
