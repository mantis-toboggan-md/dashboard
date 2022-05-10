<script>
import Select from '@/components/form/Select';
import UnitInput from '@/components/form/UnitInput';
import PercentageBar from '@/components/PercentageBar';
import { formatSi, parseSi } from '@/utils/units';
import { ROW_COMPUTED } from './shared';

export default {
  components: {
    Select, PercentageBar, UnitInput
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },
    // all limit types and their si unit configuration
    types: {
      type:    Array,
      default: () => []
    },
    // which limit in the resource quota this row is editing
    type: {
      type:     String,
      required: true
    },
    // namespace's resource quota
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    namespace: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    // resource quota limits for this namespace's project
    projectResourceQuotaLimits: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    // resource quota limits for all namespaces in this namespace's project
    namespaceResourceQuotaLimits: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    // namespace default limits as configured in the project
    defaultResourceQuotaLimits: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  mounted() {
    // We want to update the value first so that the value will be rounded to the project limit.
    // This is relevant when switching projects. If the value is 1200 and the project that it was
    // switched to only has capacity for 800 more this will force the value to be set to 800.
    if (this.value?.limit?.[this.type]) {
      this.update(this.value.limit[this.type]);
    }

    if (!this.value?.limit?.[this.type]) {
      this.update(this.defaultResourceQuotaLimits[this.type]);
    }
  },

  computed: {
    ...ROW_COMPUTED,

    // this row's value in integer form
    limitValue() {
      return parseSi(this.projectResourceQuotaLimits[this.type]);
    },

    // SI formatting and parsing opts for this limit type
    siOptions() {
      return {
        maxExponent: this.typeOption.inputExponent,
        minExponent: this.typeOption.inputExponent,
        increment:   this.typeOption.increment,
        suffix:      this.typeOption.increment === 1024 ? 'i' : ''
      };
    },

    // Array of all limits of this type, in plain integer form, defined on namespaces in the same project as this namespace
    namespaceLimits() {
      return this.namespaceResourceQuotaLimits
        .filter(resourceQuota => resourceQuota[this.type] && resourceQuota.id !== this.namespace.id)
        .map(resourceQuota => parseSi(resourceQuota[this.type], this.siOptions));
    },

    // Sum of all this project's other namespaces' limits of this type
    namespaceContribution() {
      return this.namespaceLimits.reduce((sum, limit) => sum + limit, 0);
    },

    // Sum of all this project's namespaces' limits of this type, including this namespace
    totalContribution() {
      return this.namespaceContribution + parseSi(this.value.limit[this.type] || '0', this.siOptions);
    },

    // How much of this project's limit has been set by namespaces, including this namespace
    percentageUsed() {
      return Math.min(this.totalContribution * 100 / this.projectLimit, 100);
    },

    // This project's limit in plain integer form
    projectLimit() {
      return parseSi(this.projectResourceQuotaLimits[this.type] || 0, this.siOptions);
    },

    max() {
      return this.projectLimit - this.namespaceContribution;
    },

    availableResourceQuotas() {
      return formatSi(this.projectLimit - this.totalContribution, { ...this.siOptions, addSuffixSpace: false });
    },
    slices() {
      const out = [];

      this.namespaceLimits.forEach((limit, i) => {
        const lastValue = i > 0 ? this.namespaceLimits[i - 1] : 0;
        const sliceTotal = lastValue + limit;

        out.push(sliceTotal * 100 / this.projectLimit);
      });

      return out;
    },
    tooltip() {
      const t = this.$store.getters['i18n/t'];
      const out = [
        {
          label: t('resourceQuota.tooltip.reserved'),
          // value: this.namespaceResourceQuotaLimits[0][this.type],
          value: formatSi(this.namespaceContribution, { ...this.siOptions, addSuffixSpace: false })
        },
        {
          label: t('resourceQuota.tooltip.namespace'),
          value: this.value.limit[this.type]
        },
        {
          label: t('resourceQuota.tooltip.available'),
          value: this.availableResourceQuotas
        },
        {
          label: t('resourceQuota.tooltip.max'),
          value: this.projectResourceQuotaLimits[this.type]
        }
      ];

      let formattedTooltip = '<div class="quota-percentage-tooltip">';

      (out || []).forEach((v) => {
        formattedTooltip += `
        <div style='margin-top: 5px; display: flex; justify-content: space-between;'>
          ${ v.label }
          <span style='margin-left: 20px;'>${ v.value }</span>
        </div>`;
      });
      formattedTooltip += '</div>';

      return formattedTooltip;
    },

  },

  methods: {
    update(newValue) {
      const parsedNewValue = parseSi(newValue, this.siOptions) || 0;
      const min = Math.max(parsedNewValue, 0);
      const max = Math.min(min, this.max);
      const value = formatSi(max, {
        ...this.siOptions,
        addSuffixSpace: false
      });

      this.$emit('input', this.type, value);
    }
  }
};
</script>
<template>
  <div v-if="typeOption" class="row">
    <Select
      class="mr-10"
      :mode="mode"
      :value="type"
      :disabled="true"
      :options="types"
    />
    <div class="resource-availability mr-10">
      <PercentageBar
        v-tooltip="tooltip"
        class="percentage-bar"
        :value="percentageUsed"
        :slices="slices"
        :color-stops="{'100': '--primary'}"
      />
    </div>
    <UnitInput
      :value="value.limit[type]"
      :mode="mode"
      :placeholder="typeOption.placeholder"
      :increment="typeOption.increment"
      :input-exponent="typeOption.inputExponent"
      :base-unit="typeOption.baseUnit"
      :output-modifier="true"
      @input="update"
    />
  </div>
</template>

<style lang='scss' scoped>
  .resource-availability {
    align-self: center;
  }
  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;

    & > * {
      width: 100%;
    }
  }
</style>
