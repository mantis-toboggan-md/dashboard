<script lang="ts">
import Vue from 'vue';

interface Data {}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  data() {
    return { word: '' };
  },

  computed: {
    isPalindrome() {
      if (!this.word) {
        return false;
      }

      const lowerCaseTrimString = this.word.toLowerCase().trim().replace(/\s/g, ''); // lowercase, trim, no spaces
      const reverseString = lowerCaseTrimString.toLowerCase().split('').reverse().join('');

      return reverseString === lowerCaseTrimString;
    },
  },

  methods: {},
});
</script>

<template>
  <div class="check-palindrome">
    <h2>Check palindrome</h2>

    <label class="input-text">
      Type a word:
      <input
        v-model="word"
        type="text"
      >
      </input>
    </label>

    <div class="message">
      Is palindrome: <strong>{{ isPalindrome }}</strong>
    </div>
  </div>
</template>

<style lang="scss">
.check-palindrome {
  .input-text{
    margin-top: 1rem;
  }

  .message {
    margin-top: 1.5rem;
  }
}
</style>