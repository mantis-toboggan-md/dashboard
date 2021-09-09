<script>
import bb, { area, zoom, selection } from 'billboard.js';
import bbChart from '@/mixins/bb-chart';

const SELECTED_RADIUS = 7;

export default {
  name:       'TimeSeries',
  components: { },
  mixins:     [bbChart],
  props:      {
    highlightIndex: {
      type:    Number,
      default: null
    },
  },
  data() {
    return { showReset: false };
  },

  watch: {
    highlightIndex() {
      if (this.highlightIndex === null) {
        return this.unHighlightData();
      }

      const allRects = document.querySelectorAll('.highlight-rect');

      allRects.forEach(rect => rect.remove());
      this.chart.unselect();
      this.highlightData();

      this.chart.select('Anomalous', [this.highlightIndex], true);
    },
  },

  methods: {
    createChart() {
      let chartConfig = this.defaultChartConfig;

      chartConfig = {
        ...chartConfig,
        data: {
          ...chartConfig.data,
          type:         area(),
          selection:    { enabled: selection(), draggable: false },
          onselected:   this.onSelected,
          onunselected: this.onUnselected
        },
        point:   { focus: { expand: { enabled: false }, only: false }, select: { r: SELECTED_RADIUS } },
        grid:    {
          x: { show: true },
          y: { show: true }
        },
        zoom: {
          enabled:     zoom(),
          onzoomstart: this.onZoomStart,
          onzoomend:   this.onZoomEnd
        },
        onrendered: () => {
          this.repositionHighlights();
        }
      };

      this.chart = bb.generate(
        chartConfig
      );
    },

    resetZoom() {
      this.onZoomStart();
      this.chart.unzoom();
      this.showReset = false;
    },

    onZoomStart() {
      const allRects = document.querySelectorAll('.highlight-rect');

      allRects.forEach((rect) => {
        rect.style.display = 'none';
      });
    },

    onZoomEnd() {
      this.showReset = true;
    },

    onSelected(d, element) {
      this.$emit('selected', d);
      if (this.dataSeries[d.id].shouldHighlight) {
        const highlightRect = this.createHighlightRect(element, d.index);

        element.parentNode.insertBefore(highlightRect, element);
      }
    },

    onUnselected(d, element) {
      this.$emit('unselected', d);
      const highlight = document.querySelector(`#highlight-${ d.index }`);

      if (highlight) {
        highlight.remove();
      }
    },

    highlightData(id, filter) {
      const data = this.dataSeries[id]?.data || [];

      const relevantIndices = data.reduce((all, point, idx) => {
        if (!filter || filter(point)) {
          all.push(idx);
        }

        return all;
      }, []);

      this.chart.select(id, relevantIndices, true);
    },

    unHighlightData() {
      const allRects = document.querySelectorAll('.highlight-rect');

      allRects.forEach(rect => rect.remove());
      this.chart.unselect();
    },

    createHighlightRect(element, idx) {
      const out = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

      out.setAttribute('height', 286);
      out.setAttribute('width', (SELECTED_RADIUS * 2) + 4);
      out.setAttribute('x', element.cx.baseVal.value - SELECTED_RADIUS - 2);
      out.classList.add('highlight-rect');
      out.id = `highlight-${ idx }`;

      return out;
    },

    repositionHighlights() {
      const allRects = document.querySelectorAll('.highlight-rect');

      allRects.forEach((rect) => {
        const idx = (rect.id || '').match(/[0-9]+$/g)[0];
        const circleClass = `.bb-circle-${ idx }`;
        const circleElem = document.querySelector(circleClass);

        if (circleElem) {
          const newRect = rect.cloneNode(true);

          newRect.setAttribute('x', circleElem.cx.baseVal.value - SELECTED_RADIUS - 2 );
          newRect.style.display = 'inherit';
          rect.parentNode.replaceChild(newRect, rect);
        } else {
          rect.remove();
        }
      });
    },
  }
};
</script>

<template>
  <div>
    <div class=" mb-20 input-controls">
      <span />
      <div class="reset">
        <button v-if="showReset" class="btn role-secondary" type="button" @click="resetZoom">
          {{ t('opni.chart.resetZoom') }}
        </button>
      </div>
      <div class="inputs-slot">
        <slot name="inputs" :chart="chart" :highlight-data="highlightData" :un-highlight-data="unHighlightData" />
      </div>
    </div>
    <div :id="chartId" class="bb-chart">
      ...
    </div>
  </div>
</template>

<style lang="scss">
.input-controls{
  display:grid;
  grid-template-columns: 33% 34% 33%;
  align-items:center;

  .reset{
    text-align: center;
  }
  div:last-of-type{
    text-align:end
  }

}
</style>
