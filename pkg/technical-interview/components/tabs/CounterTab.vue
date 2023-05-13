<script >
import Vue from 'vue';

export default {
  name: 'CounterTab',

  components: {},

  props: {},

  data() {
    return { count: 0 };
  },

  computed: {},

  methods: {
    incrementCount() {
      Vue.set(this, 'count', this.count + 1);
    },
  },

  watch: {}
};
</script>
<template>
  <div>
    <label>{{ t('interview.tabs.counter.label', {counter: count}) }}</label>
    <button
      type="button"
      class=""
      @click="incrementCount"
    >
      <i class="icon icon-plus" />
    </button>
  </div>
</template>

<style lang="scss" scoped>

label {
  margin-right: 10px;
}

</style>
