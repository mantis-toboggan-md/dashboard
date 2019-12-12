import { defaultState } from './index';
export default {
  init(state, payload) {
    Object.keys(payload).forEach((key) => {
      state[key] = payload[key];
    });
  },
  updateResourceInstance(state, { resourceInstance, progenitor }) {
    state.resourceInstance = resourceInstance;
    state.progenitor = progenitor;
  },
  cleanState(state) {
    Object.keys(state).forEach((key) => {
      state[key] = defaultState[key] || null;
    });
  },
};
