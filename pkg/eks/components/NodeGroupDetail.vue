<script>
import { CAPI, MANAGEMENT, NORMAN } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading.vue';
import { STATE, NAME, AGE, INTERNAL_EXTERNAL_IP } from '@shell/config/table-headers';
import { get } from '@shell/utils/object';
import { mapGetters } from 'vuex';
import { sortBy } from '@shell/utils/sort';
import MachineSummaryGraph from '@shell/components/formatter/MachineSummaryGraph';

export default {
  name: 'EKSNodeDetail',

  components: {
    ResourceTable, Loading, MachineSummaryGraph
  },

  async fetch() {
    const { id, namespace } = this.$route.params;

    this.value = await this.$store.dispatch('management/find', { type: CAPI.RANCHER_CLUSTER, id: `${ namespace }/${ id }` });
    this.normanCluster = await this.value.findNormanCluster();
    // TODO nb do we need this? Can't do this
    await this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE });
  },

  data() {
    return { value: null, normanCluster: null };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    // TODO nb generalize?
    groupByKey() {
      return "$.status.nodeLabels['eks.amazonaws.com/nodegroup']";
    },

    // TODO nb fake nodes to create empty pool table groups
    nodes() {
      return (this.value?.nodes || []).map((node) => {
        const zoneLabel = get(node, '$.status.nodeLabels["topology.kubernetes.io/zone"]');

        node.zoneLabel = zoneLabel !== '0' ? zoneLabel : null;

        return node;
      });
    },

    nodeSchema() {
      return this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE);
    },

    headers() {
      return [STATE,
        { ...NAME, value: 'spec.requestedHostname' },
        {
          name:  'zone',
          label: this.t('aks.nodePools.details.zone'),
          value: 'zoneLabel'
        },
        INTERNAL_EXTERNAL_IP,
        AGE];
    },

  },

  methods: {
    getNodeDetail(node) {
      return { ...node.detailLocation, query: { as: 'yaml' } };
    },

    configForPool(poolName) {
      const pools = this.normanCluster?.eksConfig?.nodeGroups || [];

      return pools.find((pool) => pool.nodegroupName === poolName);
    },

    poolDetailDisplay(poolName) {
      const poolSpec = this.configForPool(poolName);

      if (!poolSpec) {
        return '';
      }

      //   return '';
      const location = this.normanCluster?.eksConfig?.region;
      const machineType = poolSpec.instanceType;
      const scalingMethod = this.t('eks.nodeGroups.details.autoscaling', { min: poolSpec.minSize, max: poolSpec.maxSize });

      return `${ location } / ${ machineType }  / ${ scalingMethod } `;
    },

    getNodeSummary(group = {}) {
      // Use three buckets of states rather than actual states.
      // These are used in `stateParts` which is show in the same context as `stateParts` for machine deployments (rke2 pools))
      const res = {
        pending:     0,
        unavailable: 0,
        ready:       0,
      };

      if (!group.rows || !group.rows.length) {
        return res;
      }

      return group.rows.reduce((res, n) => {
        if (n.metadata.state.error ) {
          res.unavailable++;
        } else if (n.metadata.state.transitioning) {
          res.pending++;
        } else if (n.state !== 'active') {
          res.unavailable++;
        } else {
          res.ready++;
        }

        return res;
      }, { ...res });
    },

    getPoolStateSummary(group = {}) {
    //   return {};
      const summary = this.getNodeSummary(group);
      const poolSpec = this.configForPool(group.ref);

      let stateParts = [
        {
          label:     'Pending',
          color:     'bg-info',
          textColor: 'text-info',
          value:     summary.pending,
          sort:      1,
        },
        {
          label:     'Unavailable',
          color:     'bg-error',
          textColor: 'text-error',
          value:     summary.unavailable,
          sort:      3,
        },
        {
          label:     'Ready',
          color:     'bg-success',
          textColor: 'text-success',
          value:     summary.ready,
          sort:      4,
        },
      ].filter((x) => x.value > 0);

      stateParts = sortBy(stateParts, 'sort:desc');

      return {
        stateParts,
        desired: poolSpec.desiredSize,
        ready:   summary.ready,

      };
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <ResourceTable
      v-if="nodes && nodes.length"
      :schema="nodeSchema"
      :headers="headers"
      :rows="nodes"
      :group-by="groupByKey"
      :groupable="true"
      :group-sort="['pool.nameDisplay']"
      :table-actions="false"
      :get-custom-detail-link="getNodeDetail"
    >
      <template #group-by-buttons>
        <!-- hide the group-by buttongroup because the buttons dont work - grouping by pool is forced -->
        <span />
      </template>

      <template #group-by="{group}">
        <div
          class="pool-row"
          :class="{'has-description':group.ref}"
        >
          <div
            v-trim-whitespace
            class="group-tab"
          >
            <div
              v-if="group.ref"
              v-clean-html="t('resourceTable.groupLabel.nodePool', { name: group.ref}, true)"
            />
            <div
              v-else
              v-clean-html="t('resourceTable.groupLabel.notInANodePool')"
            />
            <div
              v-if="group.ref"
              class="description text-muted text-small"
            >
              {{ poolDetailDisplay(group.ref) }}
            </div>
          </div>
          <div
            v-if="group.ref"
            class="right group-header-buttons mr-10"
          >
            <template v-if="group.ref">
              <MachineSummaryGraph
                v-if="getPoolStateSummary(group)"
                :row="getPoolStateSummary(group)"
                :horizontal="true"
                class="mr-20"
              />
              <button
                v-clean-tooltip="t('node.list.scaleDown')"
                :disabled="!group.ref"
                type="button"
                class="btn btn-sm role-secondary"
              >
                <i class="icon icon-sm icon-minus" />
              </button>
              <button
                v-clean-tooltip="t('node.list.scaleUp')"
                type="button"
                class="btn btn-sm role-secondary ml-10"
              >
                <i class="icon icon-sm icon-plus" />
              </button>
            </template>
          </div>
        </div>
      </template>
    </ResourceTable>
  </div>
</template>

<style>
.pool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.has-description {
    .group-tab {
      &, &::after {
          height: 50px;
      }

      &::after {
          right: -20px;
      }

      .description {
          margin-top: -20px;
      }
    }
  }
  .group-header-buttons {
    align-items: center;
    display: flex;
  }
}
</style>
