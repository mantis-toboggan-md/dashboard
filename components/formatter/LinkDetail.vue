<script>
import { get } from '@/utils/object';
import LabeledTooltip from '@/components/form/LabeledTooltip';
import { NAME } from '@/config/product/manager';

export default {
  props: {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    reference: {
      type:    String,
      default: null,
    }
  },

  components: { LabeledTooltip },

  computed: {
    to() {
      if ( this.row && this.reference ) {
        return get(this.row, this.reference);
      }

      return this.row?.detailLocation;
    },
    clusterHasIssues() {
      return this.row.status?.conditions?.some(condition => condition.error === true);
    },

    statusErrorConditions() {
      if (this.clusterHasIssues) {
        const conditionErrors = this.row?.status.conditions
          .filter(condition => condition.error === true)
          .map((x) => {
            return { [x.type]: x.error };
          });

        return JSON.stringify({ conditionErrors });
      }

      return false;
    },
    isManager() {
      const product = this.$store.getters['currentProduct'];

      return product?.name === NAME;
    }
  }
};
</script>

<template>
  <span>
    <n-link v-if="to" :to="to">
      {{ value }}
    </n-link>
    <span v-else>{{ value }}</span>
    <LabeledTooltip
      v-if="isManager && clusterHasIssues"
      :value="statusErrorConditions"
    ></LabeledTooltip>
  </span>
</template>

<style lang="scss" scoped>
  .conditions-alert-icon {
    color: var(--error);
    padding-left: 2px;
  }
  ::v-deep {
    .labeled-tooltip, .status-icon {
      position: relative;
      display: inline;
      left: auto;
      right: auto;
      top: 2px;
      bottom: auto;
    }
  }
</style>
