<script>
import bbChart from '@/mixins/bb-chart';
import bb, { bar } from 'billboard.js';

export default {
  mixins: [bbChart],

  methods: {
    createChart() {
      const columns = [];

      const groups = [];
      const colors = {};

      Object.entries(this.dataSeries).map(([key, val]) => {
        columns.push( [key, ...val.data]);
        groups.push(key);
        if (val.color) {
          colors[key] = val.color;
        }
      });

      const data = {
        columns,
        groups: [groups],
        colors,
        x:         this.xKey,
        type:      bar(),
        onover:    (d) => {
          this.$emit('over', d, columns);
        },
        onout: (d) => {
          this.$emit('out', d, columns);
        },
        onselected:   this.onSelected,
        onunselected: this.onUnselected,
      };

      this.chart = bb.generate(
        {
          data,
          bindto:  { element: `#${ this.chartId }` },
          axis:   {
            x: {
              type:   'timeseries',
              tick: {
                format: this.xFormat, width: 50, count: this.dataSeries?.x?.data.length
              },
              max:  { value: this.maxTime, fit: true },
              min:  { value: this.minTime, fit: true },
            },
            y: {
              min:     0,
              padding: { bottom: 0 },
              type:    this.needsLogY ? 'log' : 'indexed'
            },

          },
          legend: { position: 'inset', inset: { step: 3 } },
        }
      );
    }
  }
};
</script>

<template>
  <div :id="chartId" :style="{'width': '100%'}">
    ...
  </div>
</template>
