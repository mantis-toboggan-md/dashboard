<script lang="ts">
import Vue from "vue";

interface Data {}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  data() {
    return { counter: 0 };
  },

  computed: {},

  methods: {
    increment() {
      this.counter++;
    },
    decrement() {
      this.counter--;
    },
  },
});
</script>

<template>
  <div class="counter">
    <h2>Counter</h2>

    <span class="number">
      {{ counter }}
    </span>
    <button class="button btn btn-sm role-primary" @click="increment">
      +
    </button>
    <button class="button btn btn-sm role-primary" @click="decrement">
      -
    </button>
  </div>
</template>

<style lang="scss">
.counter {
  .number {
    margin-right: 1rem
  }

  .button {
    padding: 0.5rem 1rem;
    margin-left: 0.25rem;
  }
}
</style>
