import { markRaw } from 'vue';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { TabLocation } from '@shell/core/types';

jest.mock('@shell/components/form/ResourceTabs/composable', () => ({ useTabCountWatcher: () => ({}) }));

const mockT = (key: string) => key;

const defaultGlobalMountOptions = {
  components: { Tab },
  mocks:      {
    $router: {
      replace:      jest.fn(),
      currentRoute: { _value: { hash: '' } }
    },
    $route: { hash: '' },
    t:      mockT,
    store:  { getters: { 'i18n/t': mockT } }
  }
};

// markRaw mirrors what plugin.addTab does to a registered tab's component
const ExtTabContent = markRaw({ template: '<div class="ext-tab-content">ext content</div>' });

/**
 * Build an extension tab definition of the shape getUIConfig hands back.
 *
 * `locationConfig: {}` means "applies everywhere", which is what checkExtensionRouteBinding
 * treats as a global match.
 */
const extTab = (name: string, extra: Record<string, any> = {}) => ({
  name,
  label:          name,
  component:      ExtTabContent,
  locationConfig: {},
  ...extra,
});

/**
 * Mount Tabbed with a mocked extension registry.
 *
 * Tabs are registered under TabLocation.OTHER: with none of the resource-detail, drawer or
 * cruResource providers in place, getInitialTabLocation() falls through to OTHER, which
 * saves mocking four composables.
 */
const mountWithExtTabs = (extTabs: any[], props = {}, mocks = {}, slots = {}) => mount(Tabbed, {
  props,
  slots,
  global: {
    ...defaultGlobalMountOptions,
    mocks: {
      ...defaultGlobalMountOptions.mocks,
      ...mocks,
      $store:     { getters: { 'i18n/t': mockT } },
      $extension: { getUIConfig: (_type: string, area: string) => (area === TabLocation.OTHER ? extTabs : []) },
    },
  },
});

describe('component: Tabbed', () => {
  const findTabNav = (wrapper: VueWrapper<any>) => wrapper.find('[data-testid="tabbed-block"]');

  it('should display tab navigation for a single tab when hideSingleTab is false (default)', async() => {
    const wrapper = mount(Tabbed, {
      slots:  { default: { components: { Tab }, template: '<Tab name="tab1" label="Tab 1" />' } },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(true);
  });

  it('should display tab navigation for multiple tabs when hideSingleTab is false (default)', async() => {
    const wrapper = mount(Tabbed, {
      slots: {
        default: {
          components: { Tab },
          template:   `
            <Tab name="tab1" label="Tab 1" />
            <Tab name="tab2" label="Tab 2" />
          `,
        },
      },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(true);
  });

  it('should NOT display tab navigation for a single tab when hideSingleTab is true', async() => {
    const wrapper = mount(Tabbed, {
      props:  { hideSingleTab: true },
      slots:  { default: { components: { Tab }, template: '<Tab name="tab1" label="Tab 1" />' } },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(false);
  });

  it('should display tab navigation for multiple tabs when hideSingleTab is true', async() => {
    const wrapper = mount(Tabbed, {
      props: { hideSingleTab: true },
      slots: {
        default: {
          components: { Tab },
          template:   `
            <Tab name="tab1" label="Tab 1" />
            <Tab name="tab2" label="Tab 2" />
          `,
        },
      },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(true);
  });
});

describe('component: Tabbed, extension tabs with `enabled`', () => {
  const findTabNav = (wrapper: VueWrapper<any>) => wrapper.find('[data-testid="tabbed-block"]');
  const findExtTab = (wrapper: VueWrapper<any>, name = 'ext') => wrapper.find(`[data-testid="${ name }"]`);
  const findExtContent = (wrapper: VueWrapper<any>) => wrapper.find('.ext-tab-content');

  it('should show a tab with no enabled field, for backwards compatibility', async() => {
    const wrapper = mountWithExtTabs([extTab('ext')]);

    await wrapper.vm.$nextTick();

    expect(findExtTab(wrapper).exists()).toBe(true);
    expect(findExtContent(wrapper).exists()).toBe(true);
  });

  it('should show a tab when enabled is true', async() => {
    const wrapper = mountWithExtTabs([extTab('ext', { enabled: true })]);

    await flushPromises();

    expect(findExtTab(wrapper).exists()).toBe(true);
  });

  it('should hide a tab when enabled is false, without leaving it registered', async() => {
    const wrapper = mountWithExtTabs([extTab('ext', { enabled: false })]);

    await flushPromises();

    expect(findExtTab(wrapper).exists()).toBe(false);
    expect(findExtContent(wrapper).exists()).toBe(false);
    // no orphaned header left behind in the tab registry
    expect(wrapper.vm.tabs).toHaveLength(0);
  });

  it('should not show a tab until an async predicate resolves true', async() => {
    const wrapper = mountWithExtTabs([extTab('ext', { enabled: () => Promise.resolve(true) })]);

    await wrapper.vm.$nextTick();

    // hidden while pending - it must not flash into view
    expect(findExtTab(wrapper).exists()).toBe(false);

    await flushPromises();

    expect(findExtTab(wrapper).exists()).toBe(true);
    expect(findExtContent(wrapper).exists()).toBe(true);
  });

  it('should never show a tab whose async predicate resolves false', async() => {
    const wrapper = mountWithExtTabs([extTab('ext', { enabled: () => Promise.resolve(false) })]);

    await wrapper.vm.$nextTick();
    expect(findExtTab(wrapper).exists()).toBe(false);

    await flushPromises();
    expect(findExtTab(wrapper).exists()).toBe(false);
    expect(wrapper.vm.tabs).toHaveLength(0);
  });

  it('should pass a context containing the resource, store, route and location to the predicate', async() => {
    const enabled = jest.fn().mockResolvedValue(true);
    const resource = { id: 'ns/cluster-1' };

    mountWithExtTabs([extTab('ext', { enabled })], { resource });

    await flushPromises();

    expect(enabled).toHaveBeenCalledTimes(1);
    expect(enabled.mock.calls[0][0]).toEqual(expect.objectContaining({
      resource,
      location: TabLocation.OTHER,
    }));

    const ctx = enabled.mock.calls[0][0];

    expect(ctx.$store).toBeDefined();
    expect(ctx.$route).toBeDefined();
  });

  it('should hide a tab whose predicate throws, without breaking the surrounding tabs', async() => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const enabled = () => Promise.reject(new Error('boom'));
    const wrapper = mountWithExtTabs([extTab('ext', { enabled }), extTab('ok')]);

    await flushPromises();

    expect(findExtTab(wrapper).exists()).toBe(false);
    expect(findExtTab(wrapper, 'ok').exists()).toBe(true);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('should only count resolved tabs towards hideSingleTab', async() => {
    const wrapper = mountWithExtTabs(
      [extTab('ext', { enabled: () => Promise.resolve(true) })],
      { hideSingleTab: true },
      {},
      { default: { components: { Tab }, template: '<Tab name="native" label="Native" />' } }
    );

    await wrapper.vm.$nextTick();

    // just the native tab so far - the pending one must not be counted, so the nav is hidden
    expect(wrapper.vm.sortedTabs).toHaveLength(1);
    expect(findTabNav(wrapper).exists()).toBe(false);

    await flushPromises();

    // the gated tab has arrived, so there are two and the nav appears
    expect(wrapper.vm.sortedTabs).toHaveLength(2);
    expect(findTabNav(wrapper).exists()).toBe(true);
  });

  it('should preserve a deep link into a tab gated by an async predicate', async() => {
    // A native tab is essential to this scenario: it mounts while the predicate is still
    // pending, so the sortedTabs watcher finds no tab matching #ext and falls through to
    // selecting the native tab, rewriting the hash. The gated tab must still win once it
    // arrives.
    const wrapper = mountWithExtTabs(
      [extTab('ext', { enabled: () => Promise.resolve(true) })],
      {},
      {
        $route:  { hash: '#ext' },
        $router: { replace: jest.fn(), currentRoute: { _value: { hash: '#ext' } } },
      },
      { default: { components: { Tab }, template: '<Tab name="native" label="Native" />' } }
    );

    await wrapper.vm.$nextTick();

    // the native tab is all there is so far, so it gets selected
    expect(wrapper.vm.activeTabName).toBe('native');

    await flushPromises();

    expect(wrapper.vm.activeTabName).toBe('ext');
  });

  it('should keep weight ordering among the tabs that survive filtering', async() => {
    const wrapper = mountWithExtTabs([
      extTab('low', { weight: 1 }),
      extTab('gone', { weight: 99, enabled: false }),
      extTab('high', { weight: 10 }),
    ]);

    await flushPromises();

    expect(wrapper.vm.sortedTabs.map((t: any) => t.name)).toEqual(['high', 'low']);
  });

  it('should re-evaluate predicates when the resource id changes, but not when it is mutated in place', async() => {
    const enabled = jest.fn().mockResolvedValue(true);
    const resource: any = { id: 'a', foo: 1 };
    const wrapper = mountWithExtTabs([extTab('ext', { enabled })], { resource });

    await flushPromises();
    expect(enabled).toHaveBeenCalledTimes(1);

    // same id, different object - a websocket update, not a navigation
    await wrapper.setProps({ resource: { id: 'a', foo: 2 } });
    await flushPromises();
    expect(enabled).toHaveBeenCalledTimes(1);

    await wrapper.setProps({ resource: { id: 'b' } });
    await flushPromises();
    expect(enabled).toHaveBeenCalledTimes(2);
  });

  it('should resolve independent predicates in parallel', async() => {
    let running = 0;
    let maxConcurrent = 0;
    const slow = () => {
      running++;
      maxConcurrent = Math.max(maxConcurrent, running);

      return Promise.resolve().then(() => {
        running--;

        return true;
      });
    };

    mountWithExtTabs([extTab('a', { enabled: slow }), extTab('b', { enabled: slow })]);

    await flushPromises();

    // serialising these would cap concurrency at 1
    expect(maxConcurrent).toBe(2);
  });

  it('should not mutate the shared registry objects', async() => {
    const registryTab = extTab('ext', { enabled: () => Promise.resolve(true) });
    const before = { ...registryTab };

    mountWithExtTabs([registryTab]);

    await flushPromises();

    expect(registryTab).toEqual(before);
    expect(registryTab).not.toHaveProperty('active');
  });
});
