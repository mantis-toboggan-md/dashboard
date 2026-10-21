import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import PodAffinity from '@shell/components/form/PodAffinity.vue';
import { _CREATE } from '@shell/config/query-params';

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $store: {
          getters: {
            currentStore:        () => 'cluster',
            'i18n/t':            (text: string) => text,
            'cluster/schemaFor': jest.fn(),
            'cluster/canList':   jest.fn(),
          }
        }
      }
    }
  };
};

describe('component: PodAffinity', () => {
  it('should display the weight input when the priority is preferred', () => {
    const podAffinity = {
      preferredDuringSchedulingIgnoredDuringExecution: [{
        podAffinityTerm: { topologyKey: 'test topology key 1' },
        weight:          1
      }],
      requiredDuringSchedulingIgnoredDuringExecution: [{ topologyKey: 'test topology key 2' }]
    };
    const wrapper = mount(PodAffinity, {
      props: {
        mode: _CREATE, field: 'overrideAffinity', value: { overrideAffinity: { podAffinity } }
      },
      ...requiredSetup()
    });

    expect(wrapper.find('[data-testid="pod-affinity-weight-index0"]').exists()).toBeTruthy();
    expect(wrapper.find('[data-testid="pod-affinity-weight-index1"]').exists()).toBeFalsy();
  });

  it('should display the weight input when the value is cleared', async() => {
    const podAffinity = {
      preferredDuringSchedulingIgnoredDuringExecution: [{
        podAffinityTerm: { topologyKey: 'test topology key 1' },
        weight:          1
      }],
    };

    const wrapper = mount(PodAffinity, {
      props: {
        mode: _CREATE, field: 'overrideAffinity', value: { overrideAffinity: { podAffinity } }
      },
      ...requiredSetup()
    });

    const weightInput = wrapper.find('[data-testid="pod-affinity-weight-index0"]');

    weightInput.setValue('');

    await nextTick();

    expect(wrapper.find('[data-testid="pod-affinity-weight-index0"]').exists()).toBeTruthy();
  });

  it('should not add an empty affinity to a value that has none', () => {
    const value = {};

    mount(PodAffinity, {
      props: { mode: _CREATE, value },
      ...requiredSetup()
    });

    expect(value).toStrictEqual({});
  });

  it('should add the affinity to a value that has none when the terms are updated', () => {
    const value = {};
    const wrapper = mount(PodAffinity, {
      props: { mode: _CREATE, value },
      ...requiredSetup()
    });

    (wrapper.vm as any).update();

    expect(value).toStrictEqual({
      affinity: {
        podAffinity:     { requiredDuringSchedulingIgnoredDuringExecution: [], preferredDuringSchedulingIgnoredDuringExecution: [] },
        podAntiAffinity: { requiredDuringSchedulingIgnoredDuringExecution: [], preferredDuringSchedulingIgnoredDuringExecution: [] }
      }
    });
  });

  // test with/without useRc as this changes where/how the remove button is rendered
  it.each([
    { useRc: false, removeButton: '[data-testid="remove-item-0"]' },
    { useRc: true, removeButton: '[data-testid="array-list-box0"] .actions button' },
  ])('should remove the pod selector whose remove button was clicked when useRc is $useRc', async({ useRc, removeButton }) => {
    const podAffinity = {
      requiredDuringSchedulingIgnoredDuringExecution: [
        {
          topologyKey:   'topology-a',
          labelSelector: {
            matchExpressions: [{
              key: 'key-a', operator: 'In', values: ['a']
            }]
          }
        },
        {
          topologyKey:   'topology-b',
          labelSelector: {
            matchExpressions: [{
              key: 'key-b', operator: 'In', values: ['b']
            }]
          }
        }
      ]
    };

    const wrapper = mount(PodAffinity, {
      props: {
        mode: _CREATE, value: { affinity: { podAffinity } }, useRc
      },
      ...requiredSetup()
    });

    await wrapper.find(removeButton).trigger('click');

    const remainingKeyInput = wrapper.find('[data-testid="pod-affinity-expressions-index0"] [data-testid="input-match-expression-key-control-0"]');

    expect((remainingKeyInput.element as HTMLInputElement).value).toStrictEqual('key-b');
  });
});
