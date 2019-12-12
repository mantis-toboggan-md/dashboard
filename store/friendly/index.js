import namespace from './core.v1.namespace';
import router from './rio.cattle.io.v1.router';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

export const defaultState = {
  type:             null,
  asYaml:           false,
  resourceInstance:      null,
  yaml:             null,
  model:            null,
  mode:             null,
  realMode:         null,
  routeName:        '',
  routeParams:      [],
  progenitor:       null
};

const state = () => defaultState;

export default {
  state,
  actions,
  mutations,
  getters,
  modules: { namespace, router }
};
