import { SPEC_KEYS } from './index';
import { ANNOTATION, NAMESPACE } from '@/config/types';
import { _EDIT } from '~/config/query-params';
import { clone } from '~/utils/object';

export default {
  reaourceQuotaID(state) {
    return `${ state.name }/default-quota`;
  },
  hard(state) {
    const hard = {};

    Object.keys(SPEC_KEYS).forEach((key) => {
      if (state[SPEC_KEYS[key]]) {
        hard[key] = state[SPEC_KEYS[key]];
      }
    });

    return hard;
  },
  quotaToUpdate(state, getters) {
    return { ...state.quota, spec: { hard: getters.hard } };
  },
  formatted(state, getters, rootState) {
    if (rootState.friendly.mode === _EDIT) {
      const old = clone(rootState.friendly.resourceInstance);

      old.metadata.annotations = {
        ...state.annotations,
        [ANNOTATION.DESCRIPTION]: state.description
      };
      old.metadata.labels = state.labels;

      return old;
    } else {
      return {
        type:     NAMESPACE,
        metadata: {
          name:        state.name,
          annotations: {
            ...state.annotations,
            [ANNOTATION.DESCRIPTION]: state.description
          },
          labels:      state.labels
        }
      };
    }
  }
};
