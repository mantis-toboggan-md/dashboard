<script lang="ts">
import Vue from 'vue';

interface Data {
    userPhrase: string | null;
}

export default Vue.extend({
  data(): Data {
    return { userPhrase: null };
  },

  computed: {
    isPalindrome() {
      const phrase = this.userPhrase ? this.userPhrase.toLowerCase().replace(/\s/g, '') : '';
      const phraseMiddle = Math.floor(phrase.length / 2);

      for (let i = 0; i < phraseMiddle; i++) {
        if (phrase[i] !== phrase[phrase.length - i - 1]) {
          return 'is not';
        }
      }

      return 'is';
    },
  },
});
</script>

<template>
  <div>
    <label for="user-word">Provide phrase to check if it is a palindrome or not:</label>

    <input
      id="user-word"
      v-model="userPhrase"
      class="mt-10 mb-10"
      type="text"
    >
    <span v-if="userPhrase">The provided word {{ isPalindrome }} a palindrome</span>
  </div>
</template>
