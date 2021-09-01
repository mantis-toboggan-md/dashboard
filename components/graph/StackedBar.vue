<script>
import bbChart from '@/mixins/bb-chart';
import bb, { bar } from 'billboard.js';

export default {
  mixins: [bbChart],

  methods: {
    createChart() {
    //   const columns = [];
    //   const colors = {};

      //   Object.entries(this.dataSeries).map(([key, val]) => {
      //     columns.push( [key, ...val.data]);
      //     if (val.color) {
      //       colors[key] = val.color;
      //     }
      //   });

      //   const data = {
      //     columns,
      //     colors,
      //     x:         this.xKey,
      //     type:      bar(),
      //     // selection: { enabled: selection(), draggable: false },
      //     onover:    (d) => {
      //       this.$emit('over', d, columns);
      //     },
      //     onout: (d) => {
      //       this.$emit('out', d, columns);
      //     },
      //     onselected:   this.onSelected,
      //     onunselected: this.onUnselected
      //   };

      //   this.chart = bb.generate(
      //     {
      //       data,
      //       bindto:  { element: `#${ this.chartId }` },
      //       axis:   {
      //         x: {
      //           type:   'timeseries',
      //           tick: {
      //             format: this.xFormat, width: 50, count: 10
      //           },
      //           max:  { value: this.maxTime, fit: true },
      //           min:  { value: this.minTime, fit: true },
      //         },
      //         y: {
      //           min:     0,
      //           padding: { bottom: 0 },
      //           type:    this.needsLogY ? 'log' : 'indexed'
      //         },

    //       },
    //       //   point:   { focus: { expand: { enabled: false }, only: false }, select: { r: SELECTED_RADIUS } },
    //       legend:     { position: 'inset', inset: { step: 3 } },
    //       //   tooltip: { contents: this.formatTooltip },
    //       //   grid:    {
    //       //     x: { show: true },
    //       //     y: { show: true }
    //       //   },
    //       //   zoom: {
    //       //     enabled:     zoom(),
    //       //     type:        'drag',
    //       //     onzoomstart: this.onZoomStart,
    //       //     onzoomend:   this.onZoomEnd
    //       //   },
    //       onrendered: () => {
    //         // this.repositionHighlights();
    //       }
    //     }
    //   );
    }
  }
};
</script>

<template>
  <div :id="chartId">
    ...
  </div>
</template>
