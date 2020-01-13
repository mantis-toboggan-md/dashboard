import Vue from 'vue';
import { defaultState } from './index';
import { get, cleanUp } from '~/utils/object';
import { ANNOTATION } from '~/config/types';
import { randomStr } from '~/utils/string';

export default {
  cleanState(state) {
    Object.keys(state).forEach((key) => {
      state[key] = defaultState[key];
    });
  },
  populateResourceFields(state, { resourceInstance }) {
    const annotations = get(resourceInstance, 'metadata.annotations') || {};

    state.name = get(resourceInstance, 'metadata.name');
    state.description = annotations[ANNOTATION.DESCRIPTION] || '';
    state.namespace = get(resourceInstance, 'metadata.namespace') || 'default';

    const routes = get(resourceInstance, 'spec.routes') || [];

    routes.forEach((route) => {
      const id = randomStr(4);

      const {
        to = [], redirect = {}, headers = {}, match = {}, mirror = {}, fault = {}
      } = route;
      const {
        methods, headers:matchHeaders, path, cookies
      } = match;

      const allHeaders = Object.keys(headers).reduce((all, op) => {
        return headers[op].map((rule) => {
          return {
            op, name:  rule.name, value: rule.value
          };
        });
      }, []);

      state.routes.push(id);
      Vue.set(state.destinations, id, to);
      Vue.set(state.matchMethods, id, methods);
      Vue.set(state.matchHeaders, id, matchHeaders);
      Vue.set(state.matchPaths, id, path);
      Vue.set(state.cookies, id, cookies);
      Vue.set(state.redirects, id, redirect);
      Vue.set(state.headers, id, allHeaders);
      Vue.set(state.mirrors, id, mirror);
      Vue.set(state.faults, id, fault);
      Vue.set(state.shouldFault, id, false);
      Vue.set(state.shouldMirror, id, false);
      Vue.set(state.shouldRedirect, id, false);
    });
  },

  repositionRoute(state, { position, direction }) {
    if (direction === 'delete') {
      state.routes.splice(position, 1);
    } else {
      let newPosition = position;

      if (direction === 'down') {
      // if already the last route, move to first route
        newPosition = newPosition + 1 < state.routes.length - 1 ? newPosition + 1 : 0;
      } else {
      // if already the first route, move to last route
        newPosition = newPosition - 1 < 0 ? state.routes.length - 1 : newPosition - 1;
      }

      const toSwap = state.routes[position];
      const swapped = state.routes[newPosition];

      state.routes.splice(newPosition, 1, toSwap);
      state.routes.splice(position, 1, swapped);
    }
  },

  // update a weighted destination for given route ID, at index i. If no index given, add destination at end of list
  updateDestination(state, { id, destination, i }) {
    destination = cleanUp(destination);
    if (destination && (i || i === 0)) {
      state.destinations[id][i] = destination;
    } else if (!!destination) {
      state.destinations[id].push(destination);
    } else {
      state.destinations[id].splice(i, 1);
    }
  },

  updateRedirect(state, { id, redirect }) {
    state.redirects[id] = redirect;
  },

  updateHeaders(state, { id, headers }) {
    state.headers[id] = headers;
  },

  updateMatchMethods(state, { id, methods }) {
    state.matchMethods[id] = methods;
  },

  updateMatchHeaders(state, { id, headers }) {
    state.matchHeaders[id] = headers;
  },

  updateCookies(state, { id, cookies }) {
    state.cookies[id] = cookies;
  },

  updateMatchPath(state, { id, path }) {
    state.matchPaths[id] = path;
  },

  updateMirror(state, { id, mirror }) {
    state.mirrors[id] = mirror;
  },
  toggleRedirect(state, { id }) {
    state.shouldRedirect[id] = !state.shouldRedirect[id];
  },

  toggleFault(state, { id }) {
    state.shouldFault[id] = !state.shouldFault[id];
  },

  toggleMirror(state, { id }) {
    state.shouldMirror[id] = !state.shouldMirror[id];
  },

  updateFault(state, { id, fault }) {
    state.faults[id] = fault;
  },

  addRule(state) {
    const id = randomStr(4);

    state.routes.push(id);
    Vue.set(state.destinations, id, []);
    Vue.set(state.matchMethods, id, []);
    Vue.set(state.matchHeaders, id, []);
    Vue.set(state.matchPaths, id, {});
    Vue.set(state.cookies, id, []);
    Vue.set(state.redirects, id, {});
    Vue.set(state.headers, id, []);
    Vue.set(state.mirrors, id, {});
    Vue.set(state.faults, id, {});
    Vue.set(state.shouldFault, id, false);
    Vue.set(state.shouldMirror, id, false);
    Vue.set(state.shouldRedirect, id, false);
  },

  updateMetadata(state, metadata) {
    state.name = metadata.name;
    state.namespace = metadata.namespace;
    if (get(metadata, `annotations[${ ANNOTATION.DESCRIPTION }]`)) {
      state.description = get(metadata, `annotations[${ ANNOTATION.DESCRIPTION }]`);
    }
  }

};
