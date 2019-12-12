import { ANNOTATION } from '~/config/types';
import { clone, get, cleanUp } from '~/utils/object';

export default {
  metadata(state, rootState) {
    const { name, namespace, description } = state;
    const annotations = { [ANNOTATION.DESCRIPTION]: description };

    return {
      name, namespace, annotations
    };
  },

  headerRules: state => (id) => {
    const formatted = {
      add:    [], set:    [], remove: []
    };

    for (const rule of state.headers[id]) {
      formatted[rule.op].push({
        name:  rule.name,
        value: rule.value
      });
    }

    return formatted;
  },

  matchRules: state => (id) => {
    const headers = state.matchHeaders[id];
    const methods = state.matchMethods[id];
    const path = state.matchPaths[id];

    return cleanUp({
      headers, methods, path
    });
  },

  toSave( state, getters, rootState ) {
    const router = clone(get(rootState, 'friendly.resourceInstance'));

    const {
      routes:routeIDs, headers, destinations, shouldRedirect, redirects, rewrites, faults, mirrors
    } = state;

    // update metadata
    Object.assign(router.metadata, getters.metadata);

    // re-build spec from store
    delete router.spec;
    router.spec = {};

    const routes = routeIDs.map((id) => {
      const route = {};

      // if route specifies redirect, do not include rewrite or forwarding destination(s)
      if (shouldRedirect[id]) {
        route.redirect = redirects[id];
      } else {
        route.to = destinations[id];
        route.rewrite = rewrites[id];
      }
      route.headers = getters.headerRules(id);
      route.fault = faults[id];
      route.mirror = mirrors[id];
      route.match = getters.matchRules(id);

      return cleanUp(route);
    });

    router.spec.routes = routes;

    return router;
  }

};
