<script>
import { CAPI, MANAGEMENT, NORMAN } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading.vue';
import { STATE, NAME, AGE, INTERNAL_EXTERNAL_IP } from '@shell/config/table-headers';
import { get } from '@shell/utils/object';
import { mapGetters } from 'vuex';

export default {
  name: 'AKSNodeDetail',

  components: { ResourceTable, Loading },

  async fetch() {
    const { id, namespace } = this.$route.params;

    this.value = await this.$store.dispatch('management/find', { type: CAPI.RANCHER_CLUSTER, id: `${ namespace }/${ id }` });
    this.normanCluster = await this.value.findNormanCluster();

    await this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE });
  },

  data() {
    return { value: null, normanCluster: null };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    // TODO nb generalize?
    groupByKey() {
    //   return "$.status.nodeLabels['kubernetes.azure.com/agentpool']";
      return "$.status.nodeLabels['cloud.google.com/gke-nodepool']";
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
      const pools = this.normanCluster?.aksConfig?.nodePools || [];

      return pools.find((pool) => pool.name === poolName);
    },

    poolDetailDisplay(poolName) {
      const poolSpec = this.configForPool(poolName);

      if (!poolSpec) {
        return '';
      }

      return '';
      //   const resourceLocation = this.normanCluster?.aksConfig?.resourceLocation;

      //   const { vmSize } = poolSpec;
      //   const mode = ` ${ poolSpec.mode } ${ this.t('aks.nodePools.mode.label') }`;

      //   const scalingMethod = poolSpec.enableAutoScaling ? this.t('aks.nodePools.details.autoscaling.enabled', { min: poolSpec.minCount, max: poolSpec.maxCount }) : this.t('aks.nodePools.details.autoscaling.disabled');

    //   return `${ resourceLocation } / ${ vmSize }  / ${ mode } / ${ scalingMethod }`;
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
            class="right group-header-buttons"
          />
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
