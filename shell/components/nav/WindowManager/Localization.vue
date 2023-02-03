<script>
import Window from '@shell/components/nav/WindowManager/Window';
import { mapGetters } from 'vuex';
import { escapeHtml } from '@shell/utils/string';

export default {
  components: { Window },

  props: {
    active: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      // key is same key as displayed getter; value is array of dom nodes containing this text
      styledElements: {}
    };
  },
  // key is text as it appears on page; value is localization yaml key
  computed: { ...mapGetters({ displayed: 'i18n/displayed' }) },

  methods: {
    beforeClose() {
      // TODO nb save progress on tab close?
      console.warn('Localization in progress lost');
    },

    highlightAvailable() {
      const allRendered = Object.keys(this.displayed);

      allRendered.forEach((string) => {
        let xpath = `//*[contains(text(), "${ `${ escapeHtml(string) }` }")]`;
        let xpathResult = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null );

        const elementsContainingString = [];

        let xpathResultItem = xpathResult.iterateNext();

        if (xpathResultItem === null) {
          xpath = `//*[contains(@placeholder, "${ `${ escapeHtml(string) }` }")]`;
          xpathResult = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
          xpathResultItem = xpathResult.iterateNext();
        }
        while (xpathResultItem) {
          elementsContainingString.push(xpathResultItem);
          xpathResultItem = xpathResult.iterateNext();
        }
        elementsContainingString.forEach((element) => {
          element.classList.add('is-localized');
        });
      });
    }
  }

};
</script>

<template>
  <Window
    :before-close="beforeClose"
    :active="active"
  >
    <template #body>
      <div>
        <button
          type="button"
          class="btn role-primary"
          @click="highlightAvailable"
        >
          Highlight Localized Text
        </button>
      </div>
    </template>
    <template #title>
      download button go here
    </template>
  </Window>
</template>

<style lang='scss'>
.is-localized {
  border: 1px solid red;
}

</style>
