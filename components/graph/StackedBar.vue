<script>
import bbChart from '@/mixins/bb-chart';
import bb, { bar } from 'billboard.js';

export default {
  mixins: [bbChart],

  methods: {
    createChart() {
      const chartConfig = this.defaultChartConfig;

      chartConfig.data.type = bar();
      chartConfig.data.groups = [Object.keys(this.dataSeries)];

      this.chart = bb.generate(
        chartConfig
      );
    }
  }
};
</script>

<template>
  <div :id="chartId" class="bb-chart bar" :style="{'width': '100%'}">
    ...
  </div>
</template>

<style>
  .bar .bb-main .bb-xgrid-focus {
      /* visibility: hidden; */
  }
</style>
