<script lang="ts">
import Vue from 'vue';import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import CounterTab from '../components/tabs/CounterTab.vue';
import PalindromeTab from '../components/tabs/PalindromeTab.vue';
import TimeCheckerTab from '../components/tabs/TimeCheckerTab.vue';
import JSONSwapperTab from '../components/tabs/JSONSwapperTab.vue';

interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {
    Tabbed,
    Tab,
    CounterTab,
    PalindromeTab,
    TimeCheckerTab,
    JSONSwapperTab
  },

  layout: 'plain',

  data() {
    return { };
  },

  computed: {},

  methods: {}

});
</script>

<template>
  <div>
    <h1>{{ t('interview.tabPage.title') }}</h1>
    <div>
      <Tabbed>
        <Tab
          label-key="interview.tabPage.tab1"
          name="tab1"
          :weight="3"
        >
          <CounterTab />
        </Tab>
        <Tab
          label-key="interview.tabPage.tab2"
          name="tab2"
          :weight="2"
        >
          <TimeCheckerTab />
        </Tab>
        <Tab
          label-key="interview.tabPage.tab3"
          name="tab3"
          :weight="1"
        >
          <JSONSwapperTab />
        </Tab>
        <Tab
          label-key="interview.tabPage.tab4"
          name="tab4"
          :weight="1"
        >
          <PalindromeTab />
        </Tab>
      </Tabbed>
    </div>
  </div>
</template>
