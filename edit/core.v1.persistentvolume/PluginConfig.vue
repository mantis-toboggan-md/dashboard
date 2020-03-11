<script>
import specs from './volume-specs';
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: {
    LabeledInput,
    Checkbox
  },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    volumeType: {
      type:    String,
      default: ''
    }
  },
  data() {
    const spec = { ...this.value };

    return { spec };
  },

  computed: {
    inputs() {
      return specs[this.volumeType] || {};
    }
  }
};
</script>

<template>
  <div>
    <template v-for="(field, key) in inputs">
      <component :is="field._type" :key="key" :value="spec[key]" v-bind="field" @input="e=>$set(spec, key, e)">
      </component>
    </template>
  </div>
</template>
