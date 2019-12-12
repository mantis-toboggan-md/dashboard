import omit from 'lodash/omit';
import { defaultState, SPEC_KEYS } from './index';
import { clone, get } from '~/utils/object';
import { cleanForNew } from '~/plugins/norman/normalize';
import { ANNOTATION } from '~/config/types';

export default {
  populateResourceFields(state, { namespaceInstance, progenitor }) {
    const { metadata = {} } = progenitor.metadata ? progenitor : namespaceInstance;

    debugger;
    const labels = metadata.labels || {};
    const annotations = metadata.annotations || {};
    const description = annotations[ANNOTATION.DESCRIPTION];

    state.labels = labels;
    state.description = description;
    state.annotations = omit(annotations, [ANNOTATION.DESCRIPTION]);
    state.name = !progenitor ? metadata.name : '' || '';
  },
  populateQuotaFields(state, { quota, mode, quotaMode }) {
    state.quotaMode = quotaMode;
    if (mode !== 'edit') {
      quota = cleanForNew(clone(quota));
    }
    state.quota = quota;
    const hard = get(quota, 'spec.hard') || {};

    Object.keys(hard).forEach((key) => {
      state[SPEC_KEYS[key]] = parseInt(hard[key]);
    });
  },
  cleanState(state) {
    Object.keys(state).forEach((key) => {
      state[key] = defaultState[key];
    });
  },
  update(state, payload) {
    const key = Object.keys(payload)[0];

    if (Object.values(SPEC_KEYS).includes(key)) {
      state.quotaChanged = true;
    }

    state[key] = payload[key];
  }

};
