<script>
import cloneDeep from 'lodash/cloneDeep';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },

  props:      {
    spec: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    enabled: {
      type:    Boolean,
      default: true
    }
  },

  inject: { disableInputs: { default: false } },

  data() {
    const all = cloneDeep(this.spec);

    return { all };
  },

  methods: {
    change() {
      this.$emit('input', cloneDeep(this.all));
    },

    addRule(rule) {
      this.all.push({
        op:    'add', name:  '', value: ''
      });
    },

    remove( index) {
      this.all.splice(index, 1);
    }
  }
};
</script>

<template>
  <div class="headers" @input="change">
    <table v-if="enabled" class="inputs-table">
      <tr v-if="all.length">
        <th>
          Header Operation
        </th>
        <th>
          Header Name
        </th>
        <th>
          Header Value
        </th>
      </tr>
      <tr v-for="(rule, i) in all" :key="i">
        <td>
          <v-select
            v-model="rule.op"
            :disabled="disableInputs"
            :serachable="false"
            class="inline"
            :options="['add', 'set', 'remove']"
            @input="change"
          />
        </td>
        <td>
          <LabeledInput v-model="rule.name" />
        </td>
        <td>
          <LabeledInput v-model="rule.value" />
        </td>
        <td>
          <button :disabled="disableInputs" type="button" class="btn btn-sm role-link" @click="remove(i)">
            REMOVE
          </button>
        </td>
      </tr>
    </table>

    <button :disabled="disableInputs" type="button" :class="{disabled: !enabled}" class="btn role-tertiary add" @click="addRule">
      <i class="icon icon-plus" />
      Add Header Operation
    </button>
  </div>
</template>
