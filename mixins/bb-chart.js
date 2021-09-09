import { randomStr } from '@/utils/string';
import { getAbsoluteValue } from '~/components/form/SuperDatePicker/util';

export default {
  props:      {
    from: {
      type:     Object,
      required: true
    },
    to: {
      type:     Object,
      required: true
    },

    /*
          {
            id1:{
              data: []
              color: string
              shouldHighlight: bool
            },
            id2:{
              data: []
              color: string
              shouldHighlight: bool
            }
          }
          */
    dataSeries: {
      type:     Object,
      required: true
    },

    // name of data series to use as x axis. If null, index is used
    xKey: {
      type:    String,
      default:  null
    },

    // TODO use DATE_FORMAT and TIME_FORMAT prefs instead
    // date/time format for x axis labels
    xFormat: {
      type:    String,
      default: '%H:%M %d %b'
    },

    chartId: {
      type:    String,
      default: () => randomStr(4)
    }
  },

  data() {
    return { chart: null, colorOptions: ['var(--primary)', 'var(--warning)', 'var(--error)'] };
  },

  computed: {
    minTime() {
      return getAbsoluteValue(this.from).valueOf();
    },

    maxTime() {
      return getAbsoluteValue(this.to).valueOf();
    },

    // TODO decide if/when we want to show log y axes
    needsLogY() {
      // const allVals = Object.values(this.dataSeries).reduce((all, each) => {
      //   all.push(...each.data);

      //   return all;
      // }, []);

      // const range = [Math.min(...allVals), Math.max(...allVals)];

      // return range[1] > range[0] + 250;
      return false;
    },

    defaultChartConfig() {
      const columns = [];

      const colors = {};

      Object.entries(this.dataSeries).map(([key, val]) => {
        columns.push( [key, ...val.data]);
        if (val.color) {
          colors[key] = val.color;
        } else if (this.colorOptions.length && (!this.xKey || key !== this.xKey)) {
          colors[key] = this.colorOptions.shift();
        }
      });

      return {
        data: {
          columns,
          colors,
          x:         this.xKey,
          onover:    (d) => {
            this.$emit('over', d, columns);
          },
          onout: (d) => {
            this.$emit('out', d, columns);
          },
        },
        bindto:  { element: `#${ this.chartId }` },
        axis:   {
          x: {
            type:   'timeseries',
            tick: {
              show:    true,
              format:    this.xFormat,
              // count:    Math.min(this.dataSeries[this.xKey]?.data.length, 10),
              values:  this.xKey ? this.dataSeries[this.xKey].data : null,
              fit:     !this.xKey,
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
        tooltip: { contents: this.formatTooltip },
        legend:  { position: 'inset', inset: { step: 3 } },
      };
    }
  },

  methods: {
    formatTooltip(data) {
      let out = "<div class='simple-box'>";

      data.forEach((category) => {
        out += `<div>${ category.name }: ${ category.value }</div>`;
      });

      return `${ out }</div>`;
    },

    showTooltip(tooltip) {
      this.chart.tooltip.show(tooltip);
    },

    hideTooltip() {
      this.chart.tooltip.hide();
    },
  },

  watch: {
    minTime() {
      this.createChart();
    },
    maxTime() {
      this.createChart();
    },
    dataSeries: {
      deep: true,
      handler() {
        this.createChart();
      }
    }
  },

  mounted() {
    this.createChart();
  },
};
