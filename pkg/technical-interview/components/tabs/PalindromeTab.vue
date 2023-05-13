<script>
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  name: 'PalindromeTab',

  components: { LabeledInput },

  data() {
    return { phrase: '' };
  },

  computed: {
    isPalindrome() {
      const recIsPalindrome = (s, idxStart) => {
        const idxEnd = s.length - idxStart - 1;

        if (idxEnd - idxStart < 1) {
          return true;
        }
        if (s[idxStart] !== s[idxEnd]) {
          return false;
        }

        return recIsPalindrome(s, idxStart + 1);
      };
      const formatted = this.phrase.toLowerCase().replace(/[^a-z0-9]/g, '');

      return recIsPalindrome(formatted, 0);
    }
  },

  methods: {},

  watch: {}
};
</script>
<template>
  <div>
    <LabeledInput
      v-model="phrase"
      class="mb-20"
      mode="edit"
      label-key="interview.tabs.palindrome.input"
      required
    />
    <label v-if="phrase.length">{{ !isPalindrome ? t('interview.tabs.palindrome.isNotPalindrome', {phrase: phrase}) : t('interview.tabs.palindrome.isPalindrome', {phrase: phrase}) }}</label>
  </div>
</template>
