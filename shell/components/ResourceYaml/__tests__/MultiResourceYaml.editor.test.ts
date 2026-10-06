import { flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { foldMatchingLines } from '@components/RcCodeMirror';
import MultiResourceYaml from '@shell/components/ResourceYaml/MultiResourceYaml.vue';
import { EditableRelatedResource } from '@shell/core/types';
import { saferDump } from '@shell/utils/create-yaml';

jest.mock('@shell/components/ResourceYaml/ResourceGraph.vue', () => ({
  __esModule: true,
  default:    {
    name: 'ResourceGraphStub', props: ['nodes', 'selected', 'saving'], emits: ['select', 'save'], template: '<div />'
  },
}));

jest.mock('@shell/components/YamlEditor.vue', () => ({
  __esModule:   true,
  EDITOR_MODES: {
    EDIT_CODE: 'EDIT_CODE', VIEW_CODE: 'VIEW_CODE', DIFF_CODE: 'DIFF_CODE'
  },
  // renders the diff mode buttons the editor is given, which YamlEditor shows above a diff
  default: {
    name:    'YamlEditorStub',
    props:   ['value', 'initialYamlValues', 'editorMode', 'diffContext'],
    emits:   ['update:value', 'onReady'],
    data:    () => ({ diffMode: 'unified' }),
    methods: {
      setDiffMode(mode: string) {
        (this as any).diffMode = mode;
      }
    },
    template: '<div><slot name="preview-buttons" :diffMode="diffMode" :setDiffMode="setDiffMode" /></div>'
  },
}));

jest.mock('@components/RcCodeMirror', () => ({
  foldAllComments:   jest.fn(),
  foldMatchingLines: jest.fn(),
  foldYamlPath:      jest.fn(),
}));

// rendered components from pkg/rancher-components resolve a different copy of vue than shell
jest.mock('@components/RcButton', () => ({ RcButton: { name: 'RcButtonStub', template: '<button><slot /></button>' } }));
jest.mock('@components/Banner', () => ({ Banner: { name: 'BannerStub', template: '<div />' } }));

// methods are kept on the prototype, as `saferDump` cannot dump functions
const model = (data: any, methods: any = {}): any => Object.assign(Object.create(methods), data);

describe('component: MultiResourceYaml', () => {
  const primary = model({
    type: 'cluster', id: 'ns/primary', metadata: { name: 'primary', namespace: 'ns' }
  }, { typeDisplay: 'Cluster' });
  const PRIMARY_ID = 'cluster:ns/primary';

  const a = model({
    type: 'config', id: 'ns/a', metadata: { name: 'a', namespace: 'ns' }
  });
  const b = model({
    type: 'config', id: 'ns/b', metadata: { name: 'b', namespace: 'ns' }
  });

  const mountComponent = (relatedResources: EditableRelatedResource[] = [{ resource: a }, { resource: b }], value: any = primary) => mount(MultiResourceYaml, {
    props:  { value, relatedResources },
    global: { provide: { store: { getters: {}, commit: jest.fn() } } }
  });

  const graph = (wrapper: any) => wrapper.findComponent({ name: 'ResourceGraphStub' });
  const editor = (wrapper: any) => wrapper.findComponent({ name: 'YamlEditorStub' });
  const diffToggle = (wrapper: any) => wrapper.find('[data-testid="multi-yaml-diff-toggle"]');
  const nodeFor = (wrapper: any, id: string) => graph(wrapper).props('nodes').find((n: any) => n.id === id);

  const select = async(wrapper: any, id: string) => {
    graph(wrapper).vm.$emit('select', id);
    await nextTick();
  };

  const edit = async(wrapper: any, yaml: string) => {
    editor(wrapper).vm.$emit('update:value', yaml);
    await nextTick();
  };

  describe('graph nodes', () => {
    it('should show the primary resource first, with no parent and its type as the group', () => {
      const wrapper = mountComponent();

      expect(graph(wrapper).props('nodes')[0]).toStrictEqual({
        id: PRIMARY_ID, label: 'primary', group: 'Cluster', modified: false
      });
    });

    it('should use `nameDisplay`, then `metadata.name`, then `id` as the label of a node', () => {
      const wrapper = mountComponent([
        {
          resource: model({
            type: 'config', id: 'ns/x', metadata: { name: 'x' }
          }, { nameDisplay: 'X display' })
        },
        {
          resource: model({
            type: 'config', id: 'ns/y', metadata: { name: 'y' }
          })
        },
        { resource: model({ type: 'config', id: 'ns/z' }) },
      ]);

      expect(graph(wrapper).props('nodes').slice(1).map((n: any) => n.label)).toStrictEqual(['X display', 'y', 'ns/z']);
    });

    it('should use `nodeId` of the entry as the node id, falling back to the resource key, then the index', () => {
      const wrapper = mountComponent([
        { resource: a, nodeId: 'custom' },
        { resource: b },
        { resource: model({ type: 'config', metadata: { name: 'no-id' } }) },
      ]);

      expect(graph(wrapper).props('nodes').slice(1).map((n: any) => n.id)).toStrictEqual(['custom', 'config:ns/b', '2']);
    });

    it('should show a related resource without `parentId` below the primary resource', () => {
      const wrapper = mountComponent();

      expect(nodeFor(wrapper, 'config:ns/a').parentId).toBe(PRIMARY_ID);
    });

    it('should show a related resource below the node its `parentId` names', () => {
      const wrapper = mountComponent([{ resource: a }, { resource: b, parentId: 'config:ns/a' }]);

      expect(nodeFor(wrapper, 'config:ns/b').parentId).toBe('config:ns/a');
    });

    it('should mark the node of a read-only entry as read-only', () => {
      const wrapper = mountComponent([{ resource: a, readOnly: true }, { resource: b }]);

      expect(nodeFor(wrapper, 'config:ns/a').readOnly).toBe(true);
      expect(nodeFor(wrapper, 'config:ns/b')).not.toHaveProperty('readOnly');
    });

    it('should show the label of the resource that replaced an entry\'s resource on save', async() => {
      const replacement = model({
        type: 'config', id: 'ns/a-v2', metadata: { name: 'a-v2', namespace: 'ns' }
      });
      const wrapper = mountComponent([{ resource: a, save: () => replacement }]);

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      graph(wrapper).vm.$emit('save', 'config:ns/a');
      await flushPromises();

      expect(nodeFor(wrapper, 'config:ns/a').label).toBe('a-v2');
    });

    it('should use `group` of the entry as the heading, falling back to the translated `groupKey`', () => {
      const wrapper = mountComponent([
        {
          resource: a, group: 'Explicit', groupKey: 'ignored.key'
        },
        { resource: b, groupKey: 'some.key' },
      ]);

      expect(nodeFor(wrapper, 'config:ns/a').group).toBe('Explicit');
      expect(nodeFor(wrapper, 'config:ns/b').group).toBe('some.key');
    });
  });

  describe('selection', () => {
    it('should select the primary resource initially', () => {
      const wrapper = mountComponent();

      expect(graph(wrapper).props('selected')).toBe(PRIMARY_ID);
      expect(editor(wrapper).props('value')).toBe(saferDump(primary));
    });

    it('should select the node the graph emits `select` for', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');

      expect(graph(wrapper).props('selected')).toBe('config:ns/a');
      expect(wrapper.vm.editorState.selected).toBe('config:ns/a');
    });

    it('should show the yaml of the selected resource in the editor', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/b');

      expect(editor(wrapper).props('value')).toBe(saferDump(b));
    });

    it('should show no editor when nothing is selected', async() => {
      const wrapper = mountComponent();

      wrapper.vm.editorState.selected = null;
      await nextTick();

      expect(editor(wrapper).exists()).toBe(false);
    });

    it('should keep the edits made to a resource when another resource is selected, then it is selected again', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await select(wrapper, 'config:ns/b');
      await select(wrapper, 'config:ns/a');

      expect(editor(wrapper).props('value')).toBe('edited: a\n');
    });

    it('should select the new primary resource when `value` changes', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await wrapper.setProps({ value: model({ type: 'cluster', id: 'ns/other' }) });

      expect(graph(wrapper).props('selected')).toBe('cluster:ns/other');
    });

    it('should show a read-only resource in view mode', async() => {
      const wrapper = mountComponent([{ resource: a, readOnly: true }]);

      await select(wrapper, 'config:ns/a');

      expect(editor(wrapper).props('editorMode')).toBe('VIEW_CODE');
    });

    it('should show an editable resource in edit mode', async() => {
      const wrapper = mountComponent([{ resource: a, readOnly: true }, { resource: b }]);

      await select(wrapper, 'config:ns/b');

      expect(editor(wrapper).props('editorMode')).toBe('EDIT_CODE');
    });

    it.each([
      ['fold', 'an editable', false, true],
      ['keep unfolded', 'a read-only', true, false],
    ])('should %s `status` when the editor of %s resource is ready', async(_action, _label, readOnly, foldsStatus) => {
      const fold = foldMatchingLines as jest.Mock;
      const view = { state: { doc: { toString: () => 'status:\n  ready: true\n' } } };
      const wrapper = mountComponent([{ resource: a, readOnly }]);

      await select(wrapper, 'config:ns/a');
      fold.mockClear();
      editor(wrapper).vm.$emit('onReady', view);

      expect(fold.mock.calls.some(([, pattern]) => String(pattern) === String(/^status:\s*$/))).toBe(foldsStatus);
      expect(fold).toHaveBeenCalledWith(view, /managedFields/);
    });
  });

  describe('modified', () => {
    it('should not mark a resource as modified before it is opened in the editor', () => {
      const wrapper = mountComponent();

      expect(nodeFor(wrapper, 'config:ns/a').modified).toBe(false);
      expect(wrapper.vm.editorState.yaml).not.toHaveProperty('config:ns/a');
    });

    it('should not mark a resource as modified when it is opened but not edited', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');

      expect(nodeFor(wrapper, 'config:ns/a').modified).toBe(false);
    });

    it('should mark a resource as modified when its yaml in the editor differs from the yaml it was opened with', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');

      expect(nodeFor(wrapper, 'config:ns/a').modified).toBe(true);
      expect(nodeFor(wrapper, 'config:ns/b').modified).toBe(false);
    });

    it('should clear the modified mark when the yaml in the editor is changed back to the yaml it was opened with', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await edit(wrapper, saferDump(a));

      expect(nodeFor(wrapper, 'config:ns/a').modified).toBe(false);
    });
  });

  describe('diff', () => {
    it('should show the diff toggle only while the selected resource is modified', async() => {
      const wrapper = mountComponent();

      expect(diffToggle(wrapper).exists()).toBe(false);

      await edit(wrapper, 'edited: primary\n');

      expect(diffToggle(wrapper).exists()).toBe(true);
    });

    it('should show the diff against the yaml the selected resource was opened with when toggled', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await diffToggle(wrapper).trigger('click');

      expect(editor(wrapper).props('editorMode')).toBe('DIFF_CODE');
      expect(editor(wrapper).props('initialYamlValues')).toBe(saferDump(a));
      expect(editor(wrapper).props('value')).toBe('edited: a\n');
    });

    it('should label the toggle as hide diff and set `aria-pressed` while the diff is shown', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, 'edited: primary\n');

      expect(diffToggle(wrapper).text()).toBe('resourceYaml.buttons.diff');
      expect(diffToggle(wrapper).attributes('aria-pressed')).toBe('false');

      await diffToggle(wrapper).trigger('click');

      expect(diffToggle(wrapper).text()).toBe('resourceYaml.buttons.hideDiff');
      expect(diffToggle(wrapper).attributes('aria-pressed')).toBe('true');
    });

    it('should leave the diff when another resource is selected', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await diffToggle(wrapper).trigger('click');
      await select(wrapper, 'config:ns/b');
      await nextTick();

      expect(editor(wrapper).props('editorMode')).toBe('EDIT_CODE');
    });

    it('should leave the diff when the selected resource is no longer modified', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await diffToggle(wrapper).trigger('click');
      await edit(wrapper, saferDump(a));
      await nextTick();

      expect(editor(wrapper).props('editorMode')).toBe('EDIT_CODE');
    });

    it('should show the full diff, with no lines of context left out', () => {
      const wrapper = mountComponent();

      expect(editor(wrapper).props('diffContext')).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should switch the diff between unified and split from the diff mode buttons', async() => {
      const wrapper = mountComponent();
      const buttons = () => wrapper.findAll('[data-testid="multi-yaml-diff-mode"] button');
      const pressed = () => buttons().map((button) => button.attributes('aria-pressed'));

      await edit(wrapper, 'edited: primary\n');
      await diffToggle(wrapper).trigger('click');

      expect(buttons().map((button) => button.text())).toStrictEqual(['generic.unified', 'generic.split']);
      expect(pressed()).toStrictEqual(['true', 'false']);

      await buttons()[1].trigger('click');

      expect(editor(wrapper).vm.diffMode).toBe('split');
      expect(pressed()).toStrictEqual(['false', 'true']);

      await buttons()[0].trigger('click');

      expect(editor(wrapper).vm.diffMode).toBe('unified');
      expect(pressed()).toStrictEqual(['true', 'false']);
    });
  });
});
