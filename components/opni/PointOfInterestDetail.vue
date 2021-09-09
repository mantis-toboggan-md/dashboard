<script>
import SortableTable from '@/components/SortableTable';
import Checkbox from '@/components/form/Checkbox';
import Drawer from '@/components/Drawer';
import DateRange from '@/components/formatter/DateRange';
import Banner from '@/components/Banner';
import StackedBar from '@/components/graph/StackedBar';
import { sortBy } from '@/utils/sort';

export const LOG_HEADERS = [
  {
    name:      'date',
    labelKey:  'tableHeaders.date',
    formatter: 'Date',
    value:     'timestamp',
    sort:      ['timestamp'],
    width:     '300px'
  },
  {
    name:     'level',
    labelKey: 'tableHeaders.level',
    value:    'level',
    sort:     ['level']
  },
  {
    name:     'component',
    labelKey: 'tableHeaders.component',
    value:    'component',
    sort:     ['component']
  },
  {
    name:      'feedback',
    labelKey:  'tableHeaders.feedback',
    formatter: 'Feedback',
    width:     '80px',
    align:     'right'
  },
];

export default {
  components: {
    Banner,
    DateRange,
    Drawer,
    SortableTable,
    Checkbox,
    StackedBar
  },

  props: {
    pointOfInterest: {
      type:    Object,
      default: null,
    },

    logs: {
      type:     Array,
      required: true
    },

    open: {
      type:     Boolean,
      required: true
    }
  },

  data() {
    return {
      LOG_HEADERS,
      showSuspicious: true,
      showAnomaly:    true,
      showEtcd:       true,
      showWorkloads:  true,
      showPods:       true,
      img:            require(`~/assets/images/mock-stack.png`)
    };
  },

  computed: {
    pointOfInterestLogs() {
      return this.logs
        .filter((log) => {
          if (!this.pointOfInterest) {
            return false;
          }

          const { from, to } = this.pointOfInterest.fromTo;

          if (log.timestamp < from || log.timestamp > to) {
            return false;
          }

          return true;
        });
    },

    filteredLogs() {
      return this.pointOfInterestLogs.filter((log) => {
        if (!this.showAnomaly && log.level === 'Anomaly') {
          return false;
        }

        if (!this.showSuspicious && log.level === 'Suspicious') {
          return false;
        }

        if (!this.showEtcd && log.component === 'etcd') {
          return false;
        }

        if (!this.showWorkloads && log.component === 'workload') {
          return false;
        }

        if (!this.showPods && log.component === 'pod') {
          return false;
        }

        return true;
      });
    },

    chartAggregates() {
      const components = this.pointOfInterest.components;
      const sortedLogs = sortBy(this.filteredLogs, 'timestamp');

      return sortedLogs.reduce((agg, log) => {
        if (!agg.x) {
          agg.x = { data: [log.timestamp] };
        }
        if (agg.x.data[agg.x.data.length - 1] === log.timestamp) {
          const idx = agg.x.data.length - 1;

          components.forEach((component) => {
            if (log.component !== component) {
              if (!agg[component]) {
                agg[component] = { data: [0] };
              } else if (!agg[component].data[idx]) {
                agg[component].data[idx] = 0;
              }
            } else if (!agg[log.component]) {
              agg[log.component] = { data: [1] };
            } else if (typeof agg[log.component].data[idx] === 'undefined') {
              agg[log.component].data.push(1);
            } else {
              agg[log.component].data[idx]++;
            }
          });
        } else {
          agg.x.data.push(log.timestamp);
          components.forEach((component) => {
            if (component !== log.component) {
              agg[component].data.push(0);
            } else {
              agg[component].data.push(1);
            }
          });
        }

        return agg;
      }, {});
    },

    anomalyLogCount() {
      return this.pointOfInterestLogs.filter(log => log.level === 'Anomaly').length;
    },

    suspiciousLogCount() {
      return this.pointOfInterestLogs.filter(log => log.level === 'Suspicious').length;
    },

    etcdLogCount() {
      return this.pointOfInterestLogs.filter(log => log.component === 'etcd').length;
    },

    workloadLogCount() {
      return this.pointOfInterestLogs.filter(log => log.component === 'workload').length;
    },

    podLogCount() {
      return this.pointOfInterestLogs.filter(log => log.component === 'pod').length;
    },
  },
  methods: {
    getColor(message) {
      return message.level === 'Anomaly' ? 'error' : 'warning';
    },
  }
};
</script>
<template>
  <Drawer :open="open" @close="$emit('close')">
    <template #title>
      <div class="p-5 pb-0">
        <h1>Point of Interest Detail</h1> &nbsp;
        <h3 v-if="pointOfInterest">
          (<DateRange :value="pointOfInterest.fromTo" />)
        </h3>
      </div>
    </template>
    <div class="contents">
      <div class="row detail mb-10">
        <div class="col span-7 p-5 pr-20">
          <div class="filters">
            <div class="mb-5">
              <label>Level: </label>
              <Checkbox v-model="showSuspicious" :label="`Suspicious (${suspiciousLogCount})`" />
              <Checkbox v-model="showAnomaly" :label="`Anomaly (${anomalyLogCount})`" />
            </div>
            <div class="mb-5">
              <label>Component: </label>
              <Checkbox v-model="showEtcd" :label="`Etcd (${etcdLogCount})`" />
              <Checkbox v-model="showWorkloads" :label="`Workloads (${workloadLogCount})`" />
              <Checkbox v-model="showPods" :label="`Pods (${podLogCount})`" />
            </div>
          </div>
          <SortableTable
            :rows="filteredLogs"
            :headers="LOG_HEADERS"
            :search="false"
            :table-actions="false"
            :row-actions="false"
            :paging="true"
            default-sort-by="name"
            key-field="id"
          >
            <template #sub-row="{row, fullColspan}">
              <tr class="opni sub-row">
                <td :colspan="fullColspan" :class="{[row.level.toLowerCase()]: true}" class="pt-0">
                  <Banner
                    class="m-0"
                    :color="getColor(row)"
                  >
                    {{ row.message }}
                  </Banner>
                </td>
              </tr>
            </template>
          </SortableTable>
        </div>
        <div class="col span-5 p-5 pb-0">
          <StackedBar
            v-if="pointOfInterest"
            x-key="x"
            x-format="%H:%M:%S.%L"
            :data-series="chartAggregates"
            :from="{value: new Date(pointOfInterest.fromTo.from), type:'ABSOLUTE'}"
            :to="{value: new Date(pointOfInterest.fromTo.to, ), type:'ABSOLUTE'}"
          />
        </div>
      </div>
    </div>
  </Drawer>
</template>

<style lang="scss" scoped>
.contents {
  display: flex;
  flex-direction: column;
  height: 380px;
  overflow: hidden;
}

.detail {
  height: 100%;

  .col:nth-of-type(2) {
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .col {
    overflow-y: scroll;
    padding-bottom: 30px;
  }

  ::v-deep {
    .anomaly {
      color: var(--error);
    }

    .suspicious {
      color: var(--warning);
    }
  }
}

h1, h3 {
  display: inline-block;
}
</style>
