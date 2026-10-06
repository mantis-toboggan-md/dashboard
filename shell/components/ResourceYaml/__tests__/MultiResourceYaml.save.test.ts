import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, toRaw } from 'vue';
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
  default: {
    name: 'YamlEditorStub', props: ['value', 'initialYamlValues', 'editorMode', 'diffContext'], emits: ['update:value'], template: '<div />'
  },
}));

// rendered components from pkg/rancher-components resolve a different copy of vue than shell
jest.mock('@components/RcButton', () => ({ RcButton: { name: 'RcButtonStub', template: '<button><slot /></button>' } }));
jest.mock('@components/Banner', () => ({ Banner: { name: 'BannerStub', template: '<div />' } }));

const mockRouter = { replace: jest.fn() };

jest.mock('vue-router', () => ({ ...jest.requireActual('vue-router'), useRouter: () => mockRouter }));

// the store's copies of saved resources, keyed by type and id
let stored: Map<string, any>;
// the models created by `$dispatch('create', ...)`, in order
let created: any[];

/**
 * A resource model; methods are kept on the prototype, as `saferDump` cannot dump functions
 *
 * `save` puts a copy with `status: saved` in `stored`, which `$getters.byId` returns
 */
const model = (data: any, methods: any = {}): any => {
  const proto: any = {
    $getters:  { byId: (type: string, id: string) => stored.get(`${ type }:${ id }`) },
    $dispatch: jest.fn((_action: string, d: any) => {
      const neu = model(d, methods);

      created.push(neu);

      return Promise.resolve(neu);
    }),
    save: jest.fn(function(this: any) {
      const copy = model({ ...this, status: 'saved' }, methods);

      stored.set(`${ this.type }:${ this.id }`, copy);

      return Promise.resolve(copy);
    }),
    ...methods,
  };

  return Object.assign(Object.create(proto), data);
};

describe('component: MultiResourceYaml', () => {
  let primary: any;
  let a: any;
  let b: any;
  const PRIMARY_ID = 'cluster:ns/primary';
  const A_ID = 'config:ns/a';

  beforeEach(() => {
    stored = new Map();
    created = [];
    mockRouter.replace.mockClear();
    primary = model({
      type: 'cluster', id: 'ns/primary', metadata: { name: 'primary', namespace: 'ns' }
    });
    a = model({
      type: 'config', id: 'ns/a', metadata: { name: 'a', namespace: 'ns' }
    });
    b = model({
      type: 'config', id: 'ns/b', metadata: { name: 'b', namespace: 'ns' }
    });
  });

  const mountComponent = (relatedResources: EditableRelatedResource[] = [{ resource: a }], value: any = primary, props: any = {}) => mount(MultiResourceYaml, {
    props: {
      value, relatedResources, ...props
    },
    global: { provide: { store: { getters: {}, commit: jest.fn() } } }
  });

  const graph = (wrapper: any) => wrapper.findComponent({ name: 'ResourceGraphStub' });
  const editor = (wrapper: any) => wrapper.findComponent({ name: 'YamlEditorStub' });
  const saveButton = (wrapper: any) => wrapper.find('[data-testid="multi-yaml-save"]');
  const cancelButton = (wrapper: any) => wrapper.find('[data-testid="multi-yaml-cancel"]');

  // a resource of the `config` type in the `ns` namespace
  const config = (name: string) => model({
    type: 'config', id: `ns/${ name }`, metadata: { name, namespace: 'ns' }
  });

  // the yaml of a resource after an edit, keeping its type and id so its save is stored under them
  const editedYaml = (type: string, name: string) => `type: ${ type }\nid: ns/${ name }\nmetadata:\n  name: ${ name }\n  namespace: ns\nspec: edited\n`;

  // a promise to resolve from the test, to hold a save in progress
  const deferred = () => {
    let resolveSave: (value?: any) => void = () => {};
    const promise = new Promise((resolve) => {
      resolveSave = resolve;
    });

    return { promise, resolve: resolveSave };
  };
  const nodeFor = (wrapper: any, id: string) => graph(wrapper).props('nodes').find((n: any) => n.id === id);

  const select = async(wrapper: any, id: string) => {
    graph(wrapper).vm.$emit('select', id);
    await nextTick();
  };

  const edit = async(wrapper: any, yaml: string) => {
    editor(wrapper).vm.$emit('update:value', yaml);
    await nextTick();
  };

  // saves every modified resource, from the button in the footer
  const save = async(wrapper: any) => {
    await saveButton(wrapper).trigger('click');
    await flushPromises();
  };

  // saves one resource, from its save button in the graph
  const saveOne = async(wrapper: any, id: string) => {
    graph(wrapper).vm.$emit('save', id);
    await flushPromises();
  };

  // selects each resource and changes its yaml
  const editEach = async(wrapper: any, edits: [string, string][]) => {
    for (const [id, yaml] of edits) {
      await select(wrapper, id);
      await edit(wrapper, yaml);
    }
  };

  const editedA = 'type: config\nid: ns/a\nmetadata:\n  name: a\n  namespace: ns\nspec: edited\n';
  const B_ID = 'config:ns/b';

  describe('save all button', () => {
    it('should be disabled while no resource is modified', async() => {
      const wrapper = mountComponent();

      await select(wrapper, A_ID);

      expect(saveButton(wrapper).element.disabled).toBe(true);

      await edit(wrapper, editedA);

      expect(saveButton(wrapper).element.disabled).toBe(false);
    });

    it('should be disabled while the save is in progress', async() => {
      const wrapper = mountComponent([{ resource: a, save: () => new Promise(() => {}) }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await saveButton(wrapper).trigger('click');

      expect(saveButton(wrapper).element.disabled).toBe(true);
    });

    it('should be disabled while only read-only resources are modified', async() => {
      const wrapper = mountComponent([{ resource: a, readOnly: true }]);

      await editEach(wrapper, [[A_ID, editedA]]);

      expect(nodeFor(wrapper, A_ID).modified).toBe(true);
      expect(saveButton(wrapper).element.disabled).toBe(true);
    });

    it('should be enabled when a resource other than the selected one is modified', async() => {
      const wrapper = mountComponent([{ resource: a }, { resource: b }]);

      await editEach(wrapper, [[A_ID, editedA]]);
      await select(wrapper, B_ID);

      expect(saveButton(wrapper).element.disabled).toBe(false);
    });
  });

  describe('saving every modified resource', () => {
    it('should save the dependencies deepest first, then the primary resource, then the dependents', async() => {
      const wrapper = mountComponent([
        { resource: config('shallow'), depth: 1 },
        {
          resource: config('deep'), depth: 2, parentId: 'config:ns/shallow'
        },
        { resource: config('user'), dependent: true },
      ]);

      await editEach(wrapper, [
        ['config:ns/user', editedYaml('config', 'user')],
        ['config:ns/shallow', editedYaml('config', 'shallow')],
        [PRIMARY_ID, editedYaml('cluster', 'primary')],
        ['config:ns/deep', editedYaml('config', 'deep')],
      ]);
      await save(wrapper);

      expect([...stored.keys()]).toStrictEqual(['config:ns/deep', 'config:ns/shallow', PRIMARY_ID, 'config:ns/user']);
    });

    it('should skip the resources that are not modified', async() => {
      const wrapper = mountComponent([{ resource: a }, { resource: b }]);

      await editEach(wrapper, [[B_ID, editedYaml('config', 'b')]]);
      await select(wrapper, A_ID);
      await save(wrapper);

      expect([...stored.keys()]).toStrictEqual([B_ID]);
    });

    it('should skip read-only resources', async() => {
      const wrapper = mountComponent([{ resource: a, readOnly: true }, { resource: b }]);

      await editEach(wrapper, [[A_ID, editedA], [B_ID, editedYaml('config', 'b')]]);
      await save(wrapper);

      expect([...stored.keys()]).toStrictEqual([B_ID]);
    });

    it('should save a resource whose yaml an earlier save in the same run wrote', async() => {
      const editedPrimary = editedYaml('cluster', 'primary');
      const wrapper = mountComponent([{
        resource: a,
        save:     ({ resource, editorState, primaryNodeId }) => {
          editorState.yaml[primaryNodeId] = editedPrimary;

          return resource;
        }
      }]);

      await editEach(wrapper, [[A_ID, editedA]]);
      await save(wrapper);

      expect(primary.$dispatch).toHaveBeenCalledWith('create', {
        type: 'cluster', id: 'ns/primary', metadata: { name: 'primary', namespace: 'ns' }, spec: 'edited'
      });
      expect(stored.has(PRIMARY_ID)).toBe(true);
    });

    it('should stop, without leaving the editor, when a `beforeSaveHook` returns false', async() => {
      const doneOverride = jest.fn();
      const wrapper = mountComponent([
        { resource: config('shallow'), depth: 1 },
        {
          resource: config('deep'), depth: 2, beforeSaveHook: () => false
        },
      ], primary, { doneOverride });

      await editEach(wrapper, [['config:ns/shallow', editedYaml('config', 'shallow')], ['config:ns/deep', editedYaml('config', 'deep')]]);
      await save(wrapper);

      expect([...stored.keys()]).toStrictEqual([]);
      expect(doneOverride).toHaveBeenCalledTimes(0);
      expect(wrapper.emitted('error')).toBeUndefined();
    });

    it('should stop, without leaving the editor, when a save rejects', async() => {
      const doneOverride = jest.fn();
      const wrapper = mountComponent([
        { resource: config('shallow'), depth: 1 },
        {
          resource: config('deep'), depth: 2, save: () => Promise.reject(new Error('save failed'))
        },
      ], primary, { doneOverride });

      await editEach(wrapper, [['config:ns/shallow', editedYaml('config', 'shallow')], ['config:ns/deep', editedYaml('config', 'deep')]]);
      await save(wrapper);

      expect([...stored.keys()]).toStrictEqual([]);
      expect(doneOverride).toHaveBeenCalledTimes(0);
      expect(wrapper.emitted('error')).toStrictEqual([[[new Error('save failed')]]]);
    });

    it.each([
      ['a `doneOverride` route', { doneOverride: { name: 'override' } }, { name: 'override' }],
      ['a `doneRoute` route', { doneRoute: { name: 'route' } }, { name: 'route' }],
      ['the `doneRoute` name, for the type of the primary resource', { doneRoute: 'c-cluster-product-resource' }, { name: 'c-cluster-product-resource', params: { resource: 'cluster' } }],
    ])('should leave the editor through %s once every resource is saved', async(_label, props, route) => {
      const wrapper = mountComponent([{ resource: a }], primary, props);

      await editEach(wrapper, [[A_ID, editedA]]);
      await save(wrapper);

      expect(mockRouter.replace).toHaveBeenCalledWith(route);
    });

    it('should leave the editor by calling `doneOverride` when it is a function, in place of `doneRoute`', async() => {
      const doneOverride = jest.fn();
      const wrapper = mountComponent([{ resource: a }], primary, { doneOverride, doneRoute: 'ignored' });

      await editEach(wrapper, [[A_ID, editedA]]);
      await save(wrapper);

      expect(doneOverride).toHaveBeenCalledWith();
      expect(mockRouter.replace).toHaveBeenCalledTimes(0);
    });
  });

  describe('saving one resource', () => {
    it('should save only the resource the graph emits `save` for', async() => {
      const wrapper = mountComponent([{ resource: a }, { resource: b }]);

      await editEach(wrapper, [[A_ID, editedA], [B_ID, editedYaml('config', 'b')], [PRIMARY_ID, editedYaml('cluster', 'primary')]]);
      await saveOne(wrapper, A_ID);

      expect([...stored.keys()]).toStrictEqual([A_ID]);
      expect(nodeFor(wrapper, B_ID).modified).toBe(true);
      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(true);
    });

    it('should not leave the editor after the save', async() => {
      const doneOverride = jest.fn();
      const wrapper = mountComponent([{ resource: a }], primary, { doneOverride });

      await editEach(wrapper, [[A_ID, editedA]]);
      await saveOne(wrapper, A_ID);

      expect(stored.has(A_ID)).toBe(true);
      expect(doneOverride).toHaveBeenCalledTimes(0);
    });

    it('should pass `saving` to the graph while the save is in progress', async() => {
      const pending = deferred();
      const wrapper = mountComponent([{ resource: a, save: ({ resource }) => pending.promise.then(() => resource) }]);

      await editEach(wrapper, [[A_ID, editedA]]);

      expect(graph(wrapper).props('saving')).toBe(false);

      graph(wrapper).vm.$emit('save', A_ID);
      await nextTick();

      expect(graph(wrapper).props('saving')).toBe(true);

      pending.resolve();
      await flushPromises();

      expect(graph(wrapper).props('saving')).toBe(false);
    });
  });

  describe('saveResource of the context', () => {
    it('should save the resource with the given node id, its hooks included', async() => {
      const beforeSaveHook = jest.fn();
      const afterSaveHook = jest.fn();
      const wrapper = mountComponent([
        {
          resource: a,
          save:     async({ resource, saveResource }) => {
            await saveResource(B_ID);

            return resource;
          }
        },
        {
          resource: b, beforeSaveHook, afterSaveHook
        },
      ]);

      await editEach(wrapper, [[A_ID, editedA]]);
      await saveOne(wrapper, A_ID);

      expect(beforeSaveHook).toHaveBeenCalledTimes(1);
      expect(afterSaveHook).toHaveBeenCalledTimes(1);
      expect(stored.has(B_ID)).toBe(true);
    });

    it('should resolve to null when the `beforeSaveHook` of that resource returns false', async() => {
      let result: any;
      const wrapper = mountComponent([
        {
          resource: a,
          save:     async({ resource, saveResource }) => {
            result = await saveResource(B_ID);

            return resource;
          }
        },
        { resource: b, beforeSaveHook: () => false },
      ]);

      await editEach(wrapper, [[A_ID, editedA]]);
      await saveOne(wrapper, A_ID);

      expect(result).toBeNull();
      expect(stored.has(B_ID)).toBe(false);
    });

    it('should reject for a node id that is not in the editor', async() => {
      let error: any;
      const wrapper = mountComponent([{
        resource: a,
        save:     async({ resource, saveResource }) => {
          error = await saveResource('config:ns/missing').catch((e: Error) => e);

          return resource;
        }
      }]);

      await editEach(wrapper, [[A_ID, editedA]]);
      await saveOne(wrapper, A_ID);

      expect(error).toStrictEqual(new Error('No resource in the editor has the node id config:ns/missing'));
    });
  });

  describe('cancel', () => {
    it('should leave the editor when no save is running', async() => {
      const doneOverride = jest.fn();
      const wrapper = mountComponent([{ resource: a }], primary, { doneOverride });

      await cancelButton(wrapper).trigger('click');
      await flushPromises();

      expect(doneOverride).toHaveBeenCalledWith();
    });

    it('should wait for a running save, its `afterSaveHook` included, before leaving the editor', async() => {
      const order: string[] = [];
      const pending = deferred();
      const wrapper = mountComponent([{
        resource:      a,
        save:          ({ resource }) => pending.promise.then(() => resource),
        afterSaveHook: () => {
          order.push('afterSaveHook');
        },
      }], primary, {
        doneOverride: () => {
          order.push('done');
        }
      });

      await editEach(wrapper, [[A_ID, editedA]]);
      graph(wrapper).vm.$emit('save', A_ID);
      await nextTick();
      await cancelButton(wrapper).trigger('click');
      await flushPromises();

      expect(order).toStrictEqual([]);

      pending.resolve();
      await flushPromises();

      expect(order).toStrictEqual(['afterSaveHook', 'done']);
    });

    it('should not leave the editor again when the running save already left it', async() => {
      const doneOverride = jest.fn();
      const pending = deferred();
      const wrapper = mountComponent([{ resource: a, save: ({ resource }) => pending.promise.then(() => resource) }], primary, { doneOverride });

      await editEach(wrapper, [[A_ID, editedA]]);
      await saveButton(wrapper).trigger('click');
      await cancelButton(wrapper).trigger('click');

      pending.resolve();
      await flushPromises();

      expect(doneOverride).toHaveBeenCalledTimes(1);
    });
  });

  describe('saving the primary resource', () => {
    const editedPrimary = 'type: cluster\nid: ns/primary\nmetadata:\n  name: primary\n  namespace: ns\nspec: edited\n';

    it('should create a model from the edited yaml in the store of the primary resource and call its `save`', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, editedPrimary);
      await save(wrapper);

      expect(primary.$dispatch).toHaveBeenCalledWith('create', {
        type: 'cluster', id: 'ns/primary', metadata: { name: 'primary', namespace: 'ns' }, spec: 'edited'
      });
      expect(created[0].save).toHaveBeenCalledWith();
    });

    it('should use the store\'s copy of the saved resource as the primary resource', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, editedPrimary);
      await save(wrapper);

      expect(editor(wrapper).props('value')).toBe(saferDump(stored.get(PRIMARY_ID)));
      expect(editor(wrapper).props('value')).toContain('status: saved');
    });

    it('should use the saved primary resource as the baseline, so the primary resource is no longer modified', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, editedPrimary);

      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(true);

      await save(wrapper);

      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(false);
      expect(editor(wrapper).props('initialYamlValues')).toBe(saferDump(stored.get(PRIMARY_ID)));
    });

    it('should pass the saved primary resource as `primaryResource` in the context of banners, hooks and saves', async() => {
      const banner = jest.fn(() => null);
      const entrySave = jest.fn(({ resource }) => resource);
      const beforeSaveHook = jest.fn();
      const wrapper = mountComponent([{
        resource: a, banner, save: entrySave, beforeSaveHook
      }]);

      await edit(wrapper, editedPrimary);
      await save(wrapper);
      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      const savedPrimary = stored.get(PRIMARY_ID);

      expect(toRaw((banner.mock.calls as any[]).at(-1)[0].primaryResource)).toBe(savedPrimary);
      expect(toRaw(beforeSaveHook.mock.calls[0][0].primaryResource)).toBe(savedPrimary);
      expect(toRaw(entrySave.mock.calls[0][0].primaryResource)).toBe(savedPrimary);
    });

    it('should resolve a 409 against the yaml the edits were made to, then save again', async() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});

      let attempts = 0;
      // the server's copy, changed in the background since the editor opened
      const live = {
        type:     'cluster',
        id:       'ns/primary',
        metadata: {
          name: 'primary', namespace: 'ns', resourceVersion: '2', labels: { background: 'change' }
        }
      };
      const methods: any = {
        $state:    { config: { namespace: 'cluster' } },
        // `cleanForDiff` is given plain values, so they are returned as they are
        $dispatch: jest.fn((action: string, d: any) => {
          if (action.endsWith('cleanForDiff')) {
            return Promise.resolve(JSON.parse(JSON.stringify(d)));
          }

          const neu = model(d, methods);

          created.push(neu);

          return Promise.resolve(neu);
        }),
        // the first save is rejected with a 409, which reloads the store's copy, as `_save` does
        save: jest.fn(function(this: any) {
          attempts++;

          if (attempts === 1) {
            stored.set(PRIMARY_ID, model(live, methods));

            return Promise.reject({ status: 409 }); // eslint-disable-line prefer-promise-reject-errors
          }

          const copy = model({ ...this, status: 'saved' }, methods);

          stored.set(PRIMARY_ID, copy);

          return Promise.resolve(copy);
        }),
      };
      const conflicted = model({
        type:     'cluster',
        id:       'ns/primary',
        metadata: {
          name: 'primary', namespace: 'ns', resourceVersion: '1'
        }
      }, methods);
      const wrapper = mountComponent([{ resource: a }], conflicted);

      await edit(wrapper, 'type: cluster\nid: ns/primary\nmetadata:\n  name: primary\n  namespace: ns\n  resourceVersion: "1"\nspec: edited\n');
      await save(wrapper);

      const saved = stored.get(PRIMARY_ID);

      expect(attempts).toBe(2);
      expect(wrapper.emitted('error')).toBeUndefined();
      expect(saved.spec).toBe('edited');
      expect(saved.metadata).toStrictEqual({
        name: 'primary', namespace: 'ns', resourceVersion: '2', labels: { background: 'change' }
      });
    });
  });

  describe('saving a related resource', () => {
    it('should call `beforeSaveHook`, then `save`, then `afterSaveHook`, each with the context of the resource', async() => {
      // the yaml is read when each is called, as the editor state of the resource is reset before `afterSaveHook`
      const calls: [string, any, string][] = [];
      const record = (name: string, ctx: any) => calls.push([name, ctx, ctx.editorState.yaml[ctx.nodeId]]);
      const wrapper = mountComponent([{
        resource:       a,
        beforeSaveHook: (ctx) => {
          record('before', ctx);
        },
        save: (ctx) => {
          record('save', ctx);

          return ctx.resource;
        },
        afterSaveHook: (ctx) => {
          record('after', ctx);
        },
      }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(calls.map(([name]) => name)).toStrictEqual(['before', 'save', 'after']);
      expect(calls.map(([, , yaml]) => yaml)).toStrictEqual([editedA, editedA, undefined]);
      calls.forEach(([, ctx]) => {
        expect(toRaw(ctx.resource)).toBe(a);
        expect(ctx.nodeId).toBe(A_ID);
        expect(ctx.primaryNodeId).toBe(PRIMARY_ID);
      });
    });

    it('should cancel the save, without an error, when `beforeSaveHook` returns false', async() => {
      const entrySave = jest.fn();
      const afterSaveHook = jest.fn();
      const wrapper = mountComponent([{
        resource: a, beforeSaveHook: () => false, save: entrySave, afterSaveHook
      }]);

      await editEach(wrapper, [[A_ID, editedA]]);
      await saveOne(wrapper, A_ID);

      expect(entrySave).toHaveBeenCalledTimes(0);
      expect(afterSaveHook).toHaveBeenCalledTimes(0);
      expect(wrapper.emitted('error')).toBeUndefined();
      expect(nodeFor(wrapper, A_ID).modified).toBe(true);
    });

    it('should call `save` of the entry in place of the save of the model when the entry defines one', async() => {
      const entrySave = jest.fn(({ resource }) => resource);
      const wrapper = mountComponent([{ resource: a, save: entrySave }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(entrySave).toHaveBeenCalledTimes(1);
      expect(a.$dispatch).not.toHaveBeenCalled();
    });

    it('should save the edited yaml as a model of the store of the resource when the entry defines no `save`', async() => {
      const wrapper = mountComponent();

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(a.$dispatch).toHaveBeenCalledWith('create', {
        type: 'config', id: 'ns/a', metadata: { name: 'a', namespace: 'ns' }, spec: 'edited'
      });
      expect(created[0].save).toHaveBeenCalledWith();
    });

    it('should not call `save` or `afterSaveHook` when `beforeSaveHook` rejects', async() => {
      const entrySave = jest.fn();
      const afterSaveHook = jest.fn();
      const wrapper = mountComponent([{
        resource: a, beforeSaveHook: () => Promise.reject(new Error('before failed')), save: entrySave, afterSaveHook
      }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(entrySave).not.toHaveBeenCalled();
      expect(afterSaveHook).not.toHaveBeenCalled();
    });

    it('should not call `afterSaveHook` when `save` rejects', async() => {
      const afterSaveHook = jest.fn();
      const wrapper = mountComponent([{
        resource: a, save: () => Promise.reject(new Error('save failed')), afterSaveHook
      }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(afterSaveHook).not.toHaveBeenCalled();
    });
  });

  describe('after a save', () => {
    it('should clear the modified mark of the saved resource', async() => {
      const wrapper = mountComponent([{ resource: a, save: ({ resource }) => resource }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);

      expect(nodeFor(wrapper, A_ID).modified).toBe(true);

      await save(wrapper);

      expect(nodeFor(wrapper, A_ID).modified).toBe(false);
      expect(wrapper.vm.editorState.yaml[A_ID]).toBe(saferDump(a));
    });

    it('should remount the editor so it shows the saved yaml', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, 'type: cluster\nid: ns/primary\nspec: edited\n');

      const before = editor(wrapper).vm;

      await save(wrapper);

      expect(editor(wrapper).vm).not.toBe(before);
      expect(editor(wrapper).props('value')).toBe(saferDump(stored.get(PRIMARY_ID)));
    });

    it('should show a resource that the save returned with a different key in place of the resource it replaced', async() => {
      const replacement = model({
        type: 'config', id: 'ns/a-replacement', metadata: { name: 'a-replacement', namespace: 'ns' }
      });
      const wrapper = mountComponent([{ resource: a, save: () => replacement }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(nodeFor(wrapper, A_ID).label).toBe('a-replacement');
      expect(editor(wrapper).props('value')).toBe(saferDump(replacement));
    });

    it('should keep the node id, the selection and the children of a replaced resource', async() => {
      const replacement = model({ type: 'config', id: 'ns/a-replacement' });
      const wrapper = mountComponent([
        { resource: a, save: () => replacement },
        { resource: b, parentId: A_ID },
      ]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(graph(wrapper).props('nodes').map((n: any) => n.id)).toStrictEqual([PRIMARY_ID, A_ID, 'config:ns/b']);
      expect(graph(wrapper).props('selected')).toBe(A_ID);
      expect(nodeFor(wrapper, 'config:ns/b').parentId).toBe(A_ID);
    });

    it('should forget replaced resources when `relatedResources` changes', async() => {
      const replacement = model({ type: 'config', id: 'ns/a-replacement' });
      const entrySave = () => replacement;
      const wrapper = mountComponent([{ resource: a, save: entrySave }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);
      await wrapper.setProps({ relatedResources: [{ resource: a, save: entrySave }] });

      expect(nodeFor(wrapper, A_ID).label).toBe('a');
    });

    it('should keep the yaml that a save wrote to `editorState.yaml` for another resource, and mark that resource as modified', async() => {
      const wrapper = mountComponent([{
        resource: a,
        save:     ({ resource, editorState, primaryNodeId }) => {
          editorState.yaml[primaryNodeId] = 'written: by save\n';

          return resource;
        }
      }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await saveOne(wrapper, A_ID);

      expect(wrapper.vm.editorState.yaml[PRIMARY_ID]).toBe('written: by save\n');
      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(true);
    });

    it('should use the yaml that the other resource was loaded with as its baseline, so its diff shows only what the save wrote', async() => {
      const wrapper = mountComponent([{
        resource: a,
        save:     ({ resource, editorState, primaryNodeId }) => {
          editorState.yaml[primaryNodeId] = 'written: by save\n';

          return resource;
        }
      }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await saveOne(wrapper, A_ID);
      await select(wrapper, PRIMARY_ID);

      expect(editor(wrapper).props('initialYamlValues')).toBe(saferDump(primary));
      expect(editor(wrapper).props('value')).toBe('written: by save\n');
    });
  });

  describe('errors', () => {
    const failing = () => [{ resource: a, save: () => Promise.reject(new Error('save failed')) }];

    it('should emit `error` with the errors of a rejected save', async() => {
      const wrapper = mountComponent(failing());

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(wrapper.emitted('error')).toStrictEqual([[[new Error('save failed')]]]);
    });

    it('should keep the edited yaml and the modified mark when the save rejects', async() => {
      const wrapper = mountComponent(failing());

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(editor(wrapper).props('value')).toBe(editedA);
      expect(nodeFor(wrapper, A_ID).modified).toBe(true);
    });

    it('should enable the save button again after the save rejects', async() => {
      const wrapper = mountComponent(failing());

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(saveButton(wrapper).element.disabled).toBe(false);
    });
  });
});
