<script>
import Vue from 'vue';
import FileSelector from '@shell/components/form/FileSelector.vue';

export default {
  name: 'JSONSwapperTab',

  components: { FileSelector },

  data() {
    return {
      loadedParsed:  null,
      swappedParsed: null,
      validFile:     true,
      showSwapped:   false
    };
  },

  filters: {
    pretty(value) {
      return !!value ? JSON.stringify(value, null, 2) : '';
    }
  },

  methods: {
    prepareSwappedContent(obj) {
      const ret = {};

      // Array members can be primitive
      if ( typeof obj !== 'object') {
        return obj;
      }
      Object.keys(obj).forEach((key) => {
        let val = obj[key];

        if (typeof val === 'string' || typeof val === 'number') { // not switching booleans to avoid duplicated keys
          ret[val] = key;
        } else if (Array.isArray(val)) {
          val = val.map(el => this.prepareSwappedContent(el));
          ret[key] = val;
        } else if (val === Object(val)) {
          val = this.prepareSwappedContent(val);
          ret[key] = val;
        } else {
          ret[key] = val;
        }
      });

      return ret;
    },

    onJSONFileSelected(file) {
      try {
        const parsed = JSON.parse(file);

        Vue.set(this, 'loadedParsed', parsed);
        Vue.set(this, 'validFile', !!parsed);
        const swapped = this.prepareSwappedContent(parsed);

        Vue.set(this, 'swappedParsed', swapped);
      } catch (e) {
        Vue.set(this, 'validFile', false);
      }
    },
    swapValues() {
      Vue.set(this, 'showSwapped', !this.showSwapped);
    }
  },

  watch: {}
};
</script>
<template>
  <div class="container">
    <div class="buttons">
      <FileSelector
        class="role-tertiary add mt-2"
        :label="t('interview.tabs.jsonswapper.upload')"
        :raw-data="false"
        @selected="onJSONFileSelected"
      />
      <div class="tooltip">
        <button
          type="button"
          class="btn role-secondary"
          :disabled="!loadedParsed"
          @click="swapValues"
        >
          {{ t('interview.tabs.jsonswapper.swap') }}
        </button>
        <span class="tooltiptext">{{ t('interview.tabs.jsonswapper.swap-tooltip') }}</span>
      </div>
    </div>
    <label v-if="!validFile">{{ t('interview.tabs.jsonswapper.error') }}</label>
    <div>
      <!-- TODO: Ideally, would put a spinner in case it takes time to display large files. -->
      <pre v-if="!!loadedParsed">{{ showSwapped ? swappedParsed : loadedParsed | pretty }}</pre>
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .container {
    display: flex;
    flex-direction: column;
  }
  .buttons {
    display: flex;
    justify-content: space-between;
  }

  .tooltip {
    position: relative;
    display: inline-block;
    border-bottom: 1px dotted black;
  }

  .tooltip .tooltiptext {
    visibility: hidden;
    width: 120px;
    background-color: rgb(194, 188, 188);
    color: #000000;
    text-align: center;
    border-radius: 6px;
    padding: 5px 0;
    right: 105%;

    /* Position the tooltip */
    position: absolute;
    z-index: 1;
  }

  .tooltip:hover .tooltiptext {
    visibility: visible;
  }
</style>
