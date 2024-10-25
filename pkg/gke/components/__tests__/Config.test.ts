import { shallowMount } from '@vue/test-utils';
import flushPromises from 'flush-promises';

import Config from '@pkg/gke/components/Config.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

const mockedStore = (versionSetting: any) => {
  return {
    getters: {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      'management/byId':         () => {
        return versionSetting;
      },
      'management/schemaFor': jest.fn(),
      'rancher/create':       () => {}
    },
    dispatch: jest.fn()
  };
};

const mockedRoute = { query: {} };

const requiredSetup = (versionSetting = { value: '<=1.27.x' }) => {
  return {
    // mixins: [mockedValidationMixin],
    global: {
      mocks: {
        $store:      mockedStore(versionSetting),
        $route:      mockedRoute,
        $fetchState: {},
      }
    }
  };
};

jest.mock('@pkg/gke/util/gcp');
jest.mock('lodash/debounce', () => jest.fn((fn) => fn));

describe('gke Config', () => {
  it.each([
    ['<=1.27.x', 13], ['<=1.29.x', 24]
  ])('should filter the version dropdown according to the supportedVersionRange setting', async(versionRange: string, numVersionsAvailable: number) => {
    const setup = requiredSetup({ value: versionRange });

    const wrapper = shallowMount(Config, {
      propsData: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project'
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const versionDropdown = wrapper.getComponent('[data-testid="gke-version-select"]');

    expect(versionDropdown.props().options).toHaveLength(numVersionsAvailable);
  });
});
