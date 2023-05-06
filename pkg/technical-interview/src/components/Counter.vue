<script lang="ts">
import Vue from 'vue';

interface Data {
  counter: number;
}

export default Vue.extend({
  data(): Data {
    return { counter: 0 };
  },

  methods: {
    incrementCounter() {
      this.counter++;
    },
  },
});
</script>

<template>
  <div>
    <h3>Counter: {{ counter }}</h3>
    <br>
    <button
      class="btn mt-5"
      @click="incrementCounter"
    >
      Increment
    </button>
  </div>
</template>
