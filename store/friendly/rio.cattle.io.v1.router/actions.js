import { ANNOTATION } from '~/config/types';

export default {
  populateResourceFields({ commit, rootState }) {
    commit('cleanState');
    const resourceInstance = rootState.friendly.resourceInstance;

    console.log('populate state with: ', resourceInstance);
    commit('populateResourceFields', { resourceInstance });
  },

  // saveRouter({ state, rootState }) {
  //   const router = clone(rootState.friendly.resourceInstance);
  //   const { name, namespace, description } = state;
  //   const { metadata = {} } = router;

  //   metadata.name = name;
  //   metadata.namespace = namespace;
  //   if (!metadata.annotations) {
  //     metadata.annotations = {};
  //   }
  //   metadata.annotations[ANNOTATION.DESCRIPTION] = description;
  // }
};
