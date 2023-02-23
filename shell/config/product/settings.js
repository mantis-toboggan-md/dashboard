import { DSL } from '@shell/store/type-map';
import { MANAGEMENT, HELM, CUSTOM_RESOURCE_DEFINITION } from '@shell/config/types';
import {
  STATE,
  FEATURE_DESCRIPTION,
  RESTART,
  NAME_UNLINKED,
} from '@shell/config/table-headers';
import { classify } from '@shell/plugins/dashboard-store/classify';

export const NAME = 'settings';

export function init(store) {
  const {
    product,
    basicType,
    configureType,
    virtualType,
    headers,
    hideBulkActions,
    spoofedType
  } = DSL(store, NAME);

  product({
    ifHaveType:          new RegExp(`${ MANAGEMENT.SETTING }|${ MANAGEMENT.FEATURE }`, 'i'),
    inStore:             'management',
    icon:                'globe',
    removable:           false,
    showClusterSwitcher: false,
    category:            'configuration',
    weight:              100,
  });

  virtualType({
    ifHaveType: MANAGEMENT.SETTING,
    labelKey:   'advancedSettings.label',
    name:       'settings',
    namespaced: false,
    weight:     100,
    icon:       'folder',
    route:      {
      name:   'c-cluster-product-resource',
      params: {
        product:  NAME,
        resource: MANAGEMENT.SETTING
      }
    }
  });

  virtualType({
    ifHaveType: MANAGEMENT.FEATURE,
    labelKey:   'featureFlags.label',
    name:       'features',
    namespaced: false,
    weight:     99,
    icon:       'folder',
    route:      {
      name:   'c-cluster-product-resource',
      params: {
        product:  NAME,
        resource: MANAGEMENT.FEATURE
      }
    }
  });

  virtualType({
    ifHaveType: MANAGEMENT.SETTING,
    labelKey:   'branding.label',
    name:       'brand',
    namespaced: false,
    weight:     98,
    icon:       'folder',
    route:      { name: 'c-cluster-settings-brand' }
  });

  virtualType({
    ifHaveType: MANAGEMENT.SETTING,
    labelKey:   'banner.settingName',
    name:       'banners',
    namespaced: false,
    weight:     98,
    icon:       'folder',
    route:      { name: 'c-cluster-settings-banners' }
  });

  virtualType({
    ifHaveType: MANAGEMENT.SETTING,
    labelKey:   'performance.settingName',
    name:       'performance',
    namespaced: false,
    weight:     97,
    icon:       'folder',
    route:      { name: 'c-cluster-settings-performance' }
  });

  virtualType({
    ifHaveType: MANAGEMENT.SETTING,
    labelKey:   'customLinks.label',
    name:       'links',
    namespaced: false,
    weight:     96,
    icon:       'folder',
    route:      { name: 'c-cluster-settings-links' }
  });
  spoofedType({
    // TODO nb translate
    label:             'Custom Resource Views',
    icon:              'folder',
    type:              'resourceview',
    ifHaveType:        CUSTOM_RESOURCE_DEFINITION,
    collectionMethods: [],
    schemas:           [
      {
        // TODO nb use constant
        id:                'resourceview',
        type:              'schema',
        collectionMethods: ['POST'],
        resourceFields:    {
          id:      { type: 'string' },
          columns: { type: 'array' }
        },
      }
    ],
    getInstances: async() => {
      const setting = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'resourceviews' });

      if (setting?.value) {
        try {
          const parsed = JSON.parse(setting.value);
          const classifies = (Object.values(parsed) || []).map(async(view) => {
            return await store.dispatch('management/create', { ...view, _type: 'resourceview' });
          });

          const out = await Promise.all(classifies);

          return out;
        } catch (e) {
          console.error(e);
        }
      }

      return [];
    }
  });

  basicType([
    'settings',
    'features',
    'brand',
    'banners',
    'performance',
    'links',
    'resourceview'
  ]);

  configureType(MANAGEMENT.SETTING, {
    isCreatable: false,
    isRemovable: false,
    showAge:     false,
    showState:   false,
    canYaml:     false,
  });

  configureType(MANAGEMENT.FEATURE, {
    isCreatable: false,
    isRemovable: false,
    showAge:     false,
    showState:   true,
    canYaml:     false,
  });

  configureType(MANAGEMENT.PROJECT, {
    isCreatable: true,
    isRemovable: true,
    showAge:     false,
    showState:   false,
    canYaml:     true,
  });

  configureType(HELM.PROJECTHELMCHART, {
    isCreatable: true,
    isRemovable: true,
    showAge:     true,
    showState:   true,
    canYaml:     true,
  });

  headers(MANAGEMENT.FEATURE, [
    STATE,
    NAME_UNLINKED,
    FEATURE_DESCRIPTION,
    RESTART,
  ]);

  hideBulkActions(MANAGEMENT.FEATURE, true);
}
