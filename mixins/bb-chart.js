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
      default: 'x'
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
    }
  },

  watch: {
    minTime() {
      this.createChart();
    },
    maxTime() {
      this.createChart();
    },
  },

  mounted() {
    this.createChart();
  },
};
