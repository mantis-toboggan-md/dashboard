import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import NodeAffinity from '@shell/components/form/NodeAffinity.vue';
import { _CREATE } from '@shell/config/query-params';

describe('component: NodeAffinity', () => {
  it('should display the weight input when the priority is preferred', () => {
    const nodeAffinity = {
      preferredDuringSchedulingIgnoredDuringExecution: [{
        preference: { matchExpressions: [] },
        weight:     1
      }],
      requiredDuringSchedulingIgnoredDuringExecution: { nodeSelectorTerms: [{ matchExpressions: [] }] }
    };
    const wrapper = mount(NodeAffinity, { props: { mode: _CREATE, value: nodeAffinity } });

    expect(wrapper.find('[data-testid="node-affinity-weight-index0"]').exists()).toBeTruthy();
    expect(wrapper.find('[data-testid="node-affinity-weight-index1"]').exists()).toBeFalsy();
  });

  it('should display the weight input when the value is cleared', async() => {
    const nodeAffinity = {
      preferredDuringSchedulingIgnoredDuringExecution: [{
        preference: { matchExpressions: [] },
        weight:     1
      }],
    };

    const wrapper = mount(NodeAffinity, { props: { mode: _CREATE, value: nodeAffinity } });

    const weightInput = wrapper.find('[data-testid="node-affinity-weight-index0"]');

    weightInput.setValue('');

    await nextTick();

    expect(wrapper.find('[data-testid="node-affinity-weight-index0"]').exists()).toBeTruthy();
  });

  // test with/without useRc as this changes where/how the remove button is rendered
  it.each([
    { useRc: false, removeButton: '[data-testid="remove-item-0"]' },
    { useRc: true, removeButton: '[data-testid="array-list-box0"] .actions button' },
  ])('should remove the node selector whose remove button was clicked when useRc is $useRc', async({ useRc, removeButton }) => {
    const nodeAffinity = {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [{
              key: 'key-a', operator: 'In', values: ['a']
            }]
          },
          {
            matchExpressions: [{
              key: 'key-b', operator: 'In', values: ['b']
            }]
          }
        ]
      }
    };

    const wrapper = mount(NodeAffinity, {
      props: {
        mode: _CREATE, value: nodeAffinity, useRc
      }
    });

    await wrapper.find(removeButton).trigger('click');

    const remainingKeyInput = wrapper.find('[data-testid="node-affinity-expressions-index0"] [data-testid="input-match-expression-key-control-0"]');

    expect((remainingKeyInput.element as HTMLInputElement).value).toStrictEqual('key-b');
  });
});
