import actions from './actions';
import getters from './getters';
import mutations from './mutations';

export const defaultState = {
  somethingNice: "You're so beautiful!",
  // metadata
  name:          '',
  namespace:     '',
  description:   '',

  // array of IDs tracking order of route-matching rules
  routes:        [],
  // each component of route is keyed to that ID
  destinations:  {},
  redirects:     {},
  rewrites:      {},
  retries:       {},
  headers:       {},
  faults:        {},
  mirrors:       {},
  timeouts:      {},

  matchPaths:   {},
  matchMethods: {},
  matchHeaders: {},
  cookies:      {},

  shouldRedirect: {},
  shouldFault:    {},
  shouldMirror:   {}
};

const state = () => defaultState;

export default {
  state,
  actions,
  mutations,
  getters
};
