/**
 * in nodepool config, oauthscopes are an array of URLS
 * format is GOOGLE_AUTH_URL/SCOPE_KEY.SCOPE_VALUE eg https://www.googleapis.com/auth/compute.readonly
 * in the nodepool form, this is represented as an object {SCOPE_KEY: SCOPE_VALUE}
*/

export const oauthScopeFormOptions = {
  userinfo: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'userinfo.email',
    }
  ],

  compute: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'compute.readonly',
    },
    {
      labelKey: 'gke.authScopes.options.readWrite',
      value:    'compute',
    },
  ],

  devstorage: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'devstorage.read_only',
    },
    {
      labelKey: 'gke.authScopes.options.writeOnly',
      value:    'devstorage.write_only',
    },
    {
      labelKey: 'gke.authScopes.options.readWrite',
      value:    'devstorage',
    },
    {
      labelKey: 'gke.authScopes.options.full',
      value:    'devstorage.full_control',
    },
  ],

  taskqueue: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'taskqueue',
    }
  ],

  bigquery: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'bigquery',
    }
  ],

  sqlservice: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'sqlservice.admin',
    }
  ],

  clouddatastore: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'clouddatastore',
    }
  ],

  logging: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.writeOnly',
      value:    'logging.write',
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'logging.read',
    },
    {
      labelKey: 'gke.authScopes.options.full',
      value:    'logging.admin',
    },
  ],

  monitoring: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.writeOnly',
      value:    'monitoring.write',
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'monitoring.read',
    },
    {
      labelKey: 'gke.authScopes.options.full',
      value:    'monitoring',
    },
  ],

  'cloud-platform': [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'cloud-platform',
    }
  ],

  'bigtable.data': [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'bigtable.data.readonly',
    },
    {
      labelKey: 'gke.authScopes.options.readWrite',
      value:    'bigtable.data.readonly',
    },
  ],

  'bigtable.admin': [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'clusterNew.googlegke.tablesOnly',
      value:    'bigtable.admin.table',
    },
    {
      labelKey: 'gke.authScopes.options.full',
      value:    'bigtable.admin',
    },
  ],

  pubsub: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'pubsub',
    }
  ],

  servicecontrol: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'servicecontrol',
    }
  ],

  'service.management': [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'service.management.readonly',
    },
    {
      labelKey: 'gke.authScopes.options.readWrite',
      value:    'service.management',
    },
  ],

  trace: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'trace.readonly',
    },
    {
      labelKey: 'gke.authScopes.options.writeOnly',
      value:    'trace.append',
    },
  ],

  source: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'source.read_only',
    },
    {
      labelKey: 'gke.authScopes.options.readWrite',
      value:    'source.read_write',
    },
    {
      labelKey: 'gke.authScopes.options.full',
      value:    'source.full_control',
    },
  ],

  cloud_debugger: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'cloud_debugger',
    }
  ],
};

const oauthScopeOptions = {
  DEFAULT: 'default',
  FULL:    'full',
  CUSTOM:  'custom'
};

const googleAuthURLPrefix = 'https://www.googleapis.com/auth/' ;
const googleFullAuthUrl = 'https://www.googleapis.com/auth/cloud-platform' ;

const defaultAuthScopes: string[] = [
  'devstorage.read_only',
  'logging.write',
  'monitoring',
  'servicecontrol',
  'service.management.readonly',
  'trace.append'
];

const defaultScopeConfig = {
  userinfo:             'none',
  compute:              'none',
  devstorage:           'devstorage.read_only',
  taskqueue:            'none',
  bigquery:             'none',
  sqlservice:           'none',
  clouddatastore:       'none',
  logging:              'logging.write',
  monitoring:           'monitoring',
  'cloud-platform':     'none',
  'bigtable.data':      'none',
  'bigtable.admin':     'none',
  pubsub:               'none',
  servicecontrol:       'none',
  'service.management': 'service.management.readonly',
  trace:                'trace.append',
  source:               'none',
  cloud_debugger:       'none'
};

function getGoogleAuthDefaultURLs() {
  return defaultAuthScopes.map((a) => `${ googleAuthURLPrefix }${ a }`);
}

/**
 * Find a given auth scope in array of oauthscopes and parse its value
 * if oauthScopes does not contain a string matching the auth scope key, assume the value is 'none'/no access
 * @param oauthScopes
 * @param key
 * @param defaultValue
 * @returns
 */

function getValueFromOauthScopes(oauthScopes: string[], key: keyof typeof defaultScopeConfig) {
  const filteredValues = oauthScopes
    .filter((scope) => scope.indexOf(key) !== -1)
    .map((scope) => {
      return scope
        .replace(googleAuthURLPrefix, '')
        .replace(key, '').split('.');
    })
    .filter((splitScopes) => splitScopes.length <= 2);

  if (filteredValues.length !== 1) {
    return defaultScopeConfig[key] || 'none';
  }

  return filteredValues[0].length === 1 ? key : `${ key }.${ filteredValues[0][1] }`;
}

/**
 * This function works in conjunction with unmapOauthScopes to convert the scopes as they are in the gke node pool spec into/out of an object more easily managed by form inputs
 * @param oauthScopesSelection auth 'mode' - default, full, or custom
 * @param scopeConfig auth scopes formatted to be used in form - see defaultScopeConfig
 * @returns array of oauthscopes as they should appear in GKE config
 */
function mapOauthScopes(oauthScopesSelection: string, scopeConfig: {[key:string]: string}) {
  if (oauthScopesSelection === oauthScopeOptions.DEFAULT) {
    return getGoogleAuthDefaultURLs();
  } else if (oauthScopesSelection === oauthScopeOptions.FULL) {
    return [googleFullAuthUrl];
  } else if (oauthScopesSelection === oauthScopeOptions.CUSTOM) {
    scopeConfig = scopeConfig || {};
    const arr: string[] = [];

    Object.keys(scopeConfig).map((key) => {
      if (scopeConfig[key] !== 'none') {
        arr.push(`https://www.googleapis.com/auth/${ scopeConfig[key] }`);
      }
    });

    return arr;
  }

  return [];
}

/**
 * Take the array of strings from GKE spec and parse it into something more easily manipulated by form
 * Object keys all map to options in oauthScopeFormOptions - values are included in oauthScopeFormOptions as well
 * @param oauthScopes gkeconfig.nodepools[].config.oauthScopes
 * @returns object containing oauthScopesSelection - oauth 'mode' and  scopeConfig - oauthscopes parsed into an object where keys are from oauthFormOptions and values are one of the values from oauthFormOptions
 */
function unmapOauthScopes(oauthScopes: string[]): {oauthScopesSelection:string, scopeConfig?:{[key:string]: string}} {
  const containsUrls = oauthScopes && oauthScopes.length > 0;

  if (!containsUrls) {
    return { oauthScopesSelection: oauthScopeOptions.DEFAULT };
  }

  const isAllAndOnlyDefaultUrls = ( getGoogleAuthDefaultURLs().length === oauthScopes.length &&
    getGoogleAuthDefaultURLs().every((url) => oauthScopes.indexOf(url) !== -1) );

  if (isAllAndOnlyDefaultUrls) {
    return { oauthScopesSelection: oauthScopeOptions.DEFAULT };
  }

  const isOnlyTheFullUrl = oauthScopes.length === 1 &&
    oauthScopes[0] === googleFullAuthUrl;

  if (isOnlyTheFullUrl) {
    return { oauthScopesSelection: oauthScopeOptions.FULL };
  }

  return {
    oauthScopesSelection: oauthScopeOptions.CUSTOM,
    scopeConfig:          {
      userinfo:             getValueFromOauthScopes(oauthScopes, 'userinfo'),
      compute:              getValueFromOauthScopes(oauthScopes, 'compute'),
      devstorage:           getValueFromOauthScopes(oauthScopes, 'devstorage'),
      taskqueue:            getValueFromOauthScopes(oauthScopes, 'taskqueue'),
      bigquery:             getValueFromOauthScopes(oauthScopes, 'bigquery'),
      sqlservice:           getValueFromOauthScopes(oauthScopes, 'sqlservice'),
      clouddatastore:       getValueFromOauthScopes(oauthScopes, 'clouddatastore'),
      logging:              getValueFromOauthScopes(oauthScopes, 'logging'),
      monitoring:           getValueFromOauthScopes(oauthScopes, 'monitoring'),
      'cloud-platform':     getValueFromOauthScopes(oauthScopes, 'cloud-platform'),
      'bigtable.data':      getValueFromOauthScopes(oauthScopes, 'bigtable.data'),
      'bigtable.admin':     getValueFromOauthScopes(oauthScopes, 'bigtable.admin'),
      pubsub:               getValueFromOauthScopes(oauthScopes, 'pubsub'),
      servicecontrol:       getValueFromOauthScopes(oauthScopes, 'servicecontrol'),
      'service.management': getValueFromOauthScopes(oauthScopes, 'service.management'),
      trace:                getValueFromOauthScopes(oauthScopes, 'trace' ),
      source:               getValueFromOauthScopes(oauthScopes, 'source' ),
      cloud_debugger:       getValueFromOauthScopes(oauthScopes, 'cloud_debugger'),
    }
  };
}
