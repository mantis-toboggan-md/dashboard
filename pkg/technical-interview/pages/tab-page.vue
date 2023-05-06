<script>
import Vue from 'vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Counter from '../src/components/Counter.vue';
import Time from '../src/components/Time.vue';
import SwapPrimitives from '../src/components/SwapPrimitives.vue';
import Palindrome from '../src/components/Palindrome.vue';

export default Vue.extend({
  components: {
    Tabbed,
    Tab,
    Counter,
    Time,
    SwapPrimitives,
    Palindrome,
  },

  layout: 'plain',
});
</script>

<template>
  <div>
    <h1>{{ t("interview.tabPage.title") }}</h1>
    <div>
      <Tabbed>
        <Tab
          name="Counter"
          :weight="4"
        >
          <Counter />
        </Tab>
        <Tab
          name="Time"
          :weight="3"
        >
          <Time />
        </Tab>
        <Tab
          name="Upload JSON"
          :weight="2"
        >
          <SwapPrimitives />
        </Tab>
        <Tab
          name="Palindrome Check"
          :weight="1"
        >
          <Palindrome />
        </Tab>
      </Tabbed>
    </div>
  </div>
</template>
