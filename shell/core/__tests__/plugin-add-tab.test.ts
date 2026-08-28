import { Plugin } from '@shell/core/plugin';
import { ExtensionPoint, TabLocation } from '@shell/core/types';
import { _DETAIL } from '@shell/config/query-params';

const component = () => Promise.resolve({ template: '<div />' });

const registered = (plugin: Plugin, where: string) => plugin.uiConfig[ExtensionPoint.TAB][where];

describe('class: Plugin, addTab', () => {
  it('should preserve an `enabled` predicate through component wrapping', () => {
    const plugin = new Plugin('test');
    const enabled = () => true;

    plugin.addTab(TabLocation.RESOURCE_DETAIL_PAGE, { resource: ['pod'] }, {
      name: 'my-tab', enabled, component
    });

    const [tab] = registered(plugin, TabLocation.RESOURCE_DETAIL_PAGE);

    expect(tab.enabled).toBe(enabled);
    // the component is wrapped, so `enabled` riding along must not be taken for granted
    expect(tab.component).not.toBe(component);
  });

  it('should preserve a boolean `enabled`', () => {
    const plugin = new Plugin('test');

    plugin.addTab(TabLocation.RESOURCE_DETAIL_PAGE, { resource: ['pod'] }, {
      name: 'my-tab', enabled: false, component
    });

    expect(registered(plugin, TabLocation.RESOURCE_DETAIL_PAGE)[0].enabled).toBe(false);
  });

  it('should leave `enabled` undefined when it is not supplied', () => {
    const plugin = new Plugin('test');

    plugin.addTab(TabLocation.RESOURCE_DETAIL_PAGE, { resource: ['pod'] }, { name: 'my-tab', component });

    expect(registered(plugin, TabLocation.RESOURCE_DETAIL_PAGE)[0].enabled).toBeUndefined();
  });

  it('should still default the legacy RESOURCE_DETAIL location to detail mode', () => {
    const plugin = new Plugin('test');

    plugin.addTab(TabLocation.RESOURCE_DETAIL, { resource: ['pod'] }, { name: 'my-tab', component });

    expect(registered(plugin, TabLocation.RESOURCE_DETAIL)[0].locationConfig.mode).toStrictEqual([_DETAIL]);
  });

  it('should not force detail mode onto the current RESOURCE_DETAIL_PAGE location', () => {
    const plugin = new Plugin('test');

    plugin.addTab(TabLocation.RESOURCE_DETAIL_PAGE, { resource: ['pod'] }, { name: 'my-tab', component });

    expect(registered(plugin, TabLocation.RESOURCE_DETAIL_PAGE)[0].locationConfig.mode).toBeUndefined();
  });

  it('should normalise a string `when` into a resource locationConfig', () => {
    const plugin = new Plugin('test');

    plugin.addTab(TabLocation.RESOURCE_DETAIL_PAGE, 'pod', { name: 'my-tab', component });

    expect(registered(plugin, TabLocation.RESOURCE_DETAIL_PAGE)[0].locationConfig).toStrictEqual({ resource: 'pod' });
  });
});
