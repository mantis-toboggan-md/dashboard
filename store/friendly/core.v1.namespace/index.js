import actions from './actions';
import getters from './getters';
import mutations from './mutations';

export const SPEC_KEYS = {
  'limits.cpu':      'limitsCPU',
  'requests.cpu':    'reqsCPU',
  'limits.memory':   'limitsMemory',
  'requests.memory': 'reqsMemory'
};

export const defaultState = {
  somethingNice: "You're so beautiful!",
  // metadata
  name:          '',
  description:   '',
  annotations:   {},
  labels:        {},

  // default resource quota
  quotaMode:        'create',
  quota:           null,
  quotaChanged:    false,
  limitsCPU:       null,
  limitsMemory:       null,
  reqsCPU:         null,
  reqsMemory:         null,
  resourceQuotaID: null

};

const state = () => defaultState;

export default {
  state,
  actions,
  mutations,
  getters
};
