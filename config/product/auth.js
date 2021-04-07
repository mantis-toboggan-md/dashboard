import { DSL } from '@/store/type-map';
// import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { MANAGEMENT, NORMAN, RBAC } from '@/config/types';
import { GROUP_NAME, GROUP_ROLE_NAME } from '@/config/table-headers';
import { uniq } from '@/utils/array';

export const NAME = 'auth';

const usersVirtualType = 'users';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
    configureType,
    componentForType,
    headers,
    mapType,
    spoofedType,
    virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveType:          MANAGEMENT.USER,
    inStore:             'management',
    icon:                'user',
    removable:           false,
    weight:              50,
    public:              true, // Hide from regular view during development
    showClusterSwitcher: false,
    category:            'configuration',
  });

  virtualType({
    label:       'Auth Provider',
    icon:        'lock',
    namespaced:  false,
    name:        'config',
    weight:      -1,
    route:       { name: 'c-cluster-auth-config' },
    ifHaveType: MANAGEMENT.AUTH_CONFIG
  });

  virtualType({
    label:       store.getters['type-map/labelFor']({ id: MANAGEMENT.USER }, 2),
    name:           usersVirtualType,
    namespaced:     false,
    weight:         102,
    icon:           'user',
    route:          {
      name:   'c-cluster-product-resource',
      params: {
        product:  NAME,
        resource: MANAGEMENT.USER,
      }
    }
  });
  configureType(MANAGEMENT.USER, { showListMasthead: false });

  spoofedType({
    label:             store.getters['type-map/labelFor']({ id: NORMAN.SPOOFED.GROUP_PRINCIPAL }, 2),
    type:              NORMAN.SPOOFED.GROUP_PRINCIPAL,
    collectionMethods: [],
    schemas:           [
      {
        id:                NORMAN.SPOOFED.GROUP_PRINCIPAL,
        type:              'schema',
        collectionMethods: [],
        resourceFields:    {},
      }
    ],
    getInstances: async() => {
      // Determine if the user can get fetch global roles & global role bindings. If not there's not much point in showing the table
      const canFetchGlobalRoles = !!store.getters[`management/schemaFor`](RBAC.GLOBAL_ROLE);
      const canFetchGlobalRoleBindings = !!store.getters[`management/schemaFor`](RBAC.GLOBAL_ROLE_BINDING);

      if (!canFetchGlobalRoles || !canFetchGlobalRoleBindings) {
        return [];
      }

      // Ensure we upfront load principals (saves making individual requests later)
      await store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals' }
      });

      // getInstances should return a list of principals that have global bindings.
      // It would be easier to just filter principals from above by those with bindings...
      // .. however the principals list from above is NOT complete and misses some that have bindings (seen when using AD)
      // So flip the logic and fetch any principal that's missing from the principal list

      const globalRoleBindings = await store.dispatch('management/findAll', {
        type: RBAC.GLOBAL_ROLE_BINDING,
        opt:  { force: true }
      });

      const uniquePrincipalIds = uniq(globalRoleBindings
        .filter(grb => !!grb.groupPrincipalName)
        .map(grb => grb.groupPrincipalName)
      );

      const allPrincipalsP = uniquePrincipalIds
        .map(async(pId) => {
          // Guard against principals that aren't retrievable (bindings to principals from previous auth providers)
          try {
            return await store.dispatch('rancher/find', {
              type: NORMAN.PRINCIPAL,
              opt:  { url: `/v3/principals/${ encodeURIComponent(pId) }` },
              id:   pId
            });
          } catch (e) {
            console.warn(`Failed to fetch Principal with id: '${ pId }'`, e); // eslint-disable-line no-console
          }
        });

      const allPrincipals = await Promise.all(allPrincipalsP);

      return allPrincipals
        .filter(p => !!p)
        .map(p => ({
          ...p,
          type: NORMAN.SPOOFED.GROUP_PRINCIPAL
        }));
    }
  });
  configureType(NORMAN.SPOOFED.GROUP_PRINCIPAL, {
    isCreatable:      false,
    showAge:          false,
    showState:        false,
    isRemovable:      false,
    showListMasthead: false,
  });
  // Use labelFor... so lookup succeeds with .'s in path.... and end result is 'trimmed' as per other entries
  mapType(NORMAN.SPOOFED.GROUP_PRINCIPAL, store.getters['type-map/labelFor']({ id: NORMAN.SPOOFED.GROUP_PRINCIPAL }, 2));
  weightType(NORMAN.SPOOFED.GROUP_PRINCIPAL, 101, true);

  configureType(MANAGEMENT.AUTH_CONFIG, {
    isCreatable: false,
    isRemovable: false,
    showAge:     false,
    location:    null,
  });

  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/github`, 'auth/github');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/openldap`, 'auth/ldap/index');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/freeipa`, 'auth/ldap/index');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/activedirectory`, 'auth/ldap/index');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/ping`, 'auth/saml');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/shibboleth`, 'auth/saml');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/okta`, 'auth/saml');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/keycloak`, 'auth/saml');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/adfs`, 'auth/saml');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/googleoauth`, 'auth/googleoauth');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/azuread`, 'auth/azuread');

  basicType([
    'config',
    usersVirtualType,
    NORMAN.SPOOFED.GROUP_PRINCIPAL
  ]);

  headers(NORMAN.SPOOFED.GROUP_PRINCIPAL, [
    GROUP_NAME,
    GROUP_ROLE_NAME
  ]);
}
