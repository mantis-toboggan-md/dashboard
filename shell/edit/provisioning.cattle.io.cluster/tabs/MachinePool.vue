<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT } from '@shell/config/query-params';
import Taints from '@shell/components/form/Taints.vue';
import RcKeyValue from '@shell/components/form/RcKeyValue.vue';
import { RcSection } from '@components/RcSection';
import { RcContentGroup } from '@components/Layout';
import { Banner } from '@components/Banner';
import UnitInput from '@shell/components/form/UnitInput.vue';
import { randomStr } from '@shell/utils/string';
import FormValidation from '@shell/mixins/form-validation';
import { MACHINE_POOL_VALIDATION } from '@shell/utils/validators/machine-pool';
import {
  clearMachinePoolAutoscalerPause,
  machinePoolAutoscalerRange,
  isAutoscalerFeatureFlagEnabled,
  isMachinePoolAutoscalerPaused,
  resumeMachinePoolAutoscaler
} from '@shell/utils/autoscaler-utils';

export default {

  name: 'MachinePool',

  emits: ['validationChanged', 'error'],

  components: {
    LabeledInput,
    Checkbox,
    Taints,
    RcKeyValue,
    RcSection,
    RcContentGroup,
    Banner,
    UnitInput,
  },

  mixins: [FormValidation],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    cluster: {
      type:    Object,
      default: () => ({})
    },

    infrastructureCluster: {
      type:    Object,
      default: () => ({})
    },

    // no credentials are required for elemental machine pools
    credentialId: {
      type:    String,
      default: null
    },
    projectId: {
      type:    String,
      default: null
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    provider: {
      type:     String,
      required: true,
    },

    idx: {
      type:     Number,
      required: true,
    },

    machinePools: {
      type:    Array,
      default: () => []
    },

    // Is the UI busy (e.g. during save)
    busy: {
      type:    Boolean,
      default: false,
    },

    poolId: {
      type:     String,
      required: true,
    },

    // this is a useful info when in edit mode you add a new pool, example of use in vmwarevsphere.vue
    poolCreateMode: {
      type:     Boolean,
      required: true,
    },
    hideAdvanced: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      uuid: randomStr(),

      advancedExpanded: false,

      unhealthyNodeTimeoutInteger: 0,

      validationErrors: [],

      MACHINE_POOL_VALIDATION,

      fvFormRuleSets: MACHINE_POOL_VALIDATION.RULESETS,
      fvExtraRules:   {
        isAutoscalerMaxGreaterThanMin: () => {
          const min = this.value?.pool?.autoscalingMinSize || 0;
          const max = this.value?.pool?.autoscalingMaxSize || 0;

          return max - min >= 0 ? undefined : this.t('cluster.machinePool.autoscaler.validation.isAutoscalerMaxGreaterThanMin');
        },
        uniquePoolName: (name) => {
          if (!name) {
            return undefined;
          }

          const otherPools = (this.machinePools || []).filter((p) => !p.remove && p !== this.value);
          const isDuplicate = otherPools.some((p) => p.pool.name?.toLowerCase() === name.toLowerCase());

          return isDuplicate ? this.t('cluster.machinePool.name.unique') : undefined;
        }
      }
    };
  },

  computed: {
    configComponent() {
      if (this.$store.getters['type-map/hasCustomMachineConfigComponent'](this.provider)) {
        return this.$store.getters['type-map/importMachineConfig'](this.provider);
      }

      return this.$store.getters['type-map/importMachineConfig']('generic');
    },

    distro() {
      return this.cluster?.isK3s ? 'k3s' : 'rke2';
    },

    isWindows() {
      return this.value?.config?.os === 'windows';
    },

    isAutoscalerFeatureEnabled() {
      return isAutoscalerFeatureFlagEnabled(this.$store);
    },

    isAutoscalerPaused() {
      return isMachinePoolAutoscalerPaused(this.value?.pool);
    },

    pausedAutoscalerRange() {
      return machinePoolAutoscalerRange(this.value?.pool);
    },

    isAutoscalerEnabled: {
      get() {
        const pool = this.value?.pool;

        if (!pool) {
          return false;
        }

        return 'autoscalingMinSize' in pool || 'autoscalingMaxSize' in pool;
      },
      set(val) {
        const pool = this.value.pool;

        if (!val) {
          delete pool.autoscalingMinSize;
          delete pool.autoscalingMaxSize;
          clearMachinePoolAutoscalerPause(pool);

          return;
        }

        if (isMachinePoolAutoscalerPaused(pool)) {
          resumeMachinePoolAutoscaler(pool);

          return;
        }

        clearMachinePoolAutoscalerPause(pool);
        pool.autoscalingMinSize = 1;
        pool.autoscalingMaxSize = 2;
      }
    }
  },

  watch: {
    isWindows(neu) {
      if (neu) {
        this.value.pool.etcdRole = false;
        this.value.pool.controlPlaneRole = false;
        this.value.pool.machineOS = 'windows';
      } else {
        this.value.pool.machineOS = 'linux';
      }
    },

    validationErrors: {
      handler(newValue) {
        this.$emit('validationChanged', newValue.length === 0);
      },
      deep: true
    },

    fvFormIsValid: {
      handler(newValue) {
        this.$emit('validationChanged', newValue);
      },
      deep: true
    },

    'value.pool.etcdRole'(neu) {
      if (neu) {
        this.isAutoscalerEnabled = false;
      }
    },
    'value.pool.controlPlaneRole'(neu) {
      if (neu) {
        this.isAutoscalerEnabled = false;
      }
    },
  },

  /**
   * On creation, ensure that the pool is marked valid - custom machine pools can emit further validation events
   */
  created() {
    this.unhealthyNodeTimeoutInteger = this.value.pool.unhealthyNodeTimeout ? this.parseDuration(this.value.pool.unhealthyNodeTimeout) : 0;

    this.$emit('validationChanged', true);
  },

  beforeUnmount() {
    // Ensure we emit validation event so parent can forget any validation for this Machine Pool when it is removed
    this.$emit('validationChanged', undefined);
  },

  methods: {
    parseDuration(duration) {
      // The back end stores the timeout in Duration format, for example, "42d31h10m30s".
      // Here we convert that string to an integer and return the duration as seconds.
      const splitStr = duration.split(/([a-z])/);

      const durationsAsSeconds = splitStr.reduce((old, neu, idx) => {
        const parsed = parseInt(neu);

        if ( isNaN(parsed) ) {
          return old;
        }

        const interval = splitStr[(idx + 1)];

        switch (interval) {
        case 'd':
          old.push(parsed * 24 * 60 * 60);
          break;
        case 'h':
          old.push(parsed * 60 * 60);
          break;
        case 'm':
          old.push(parsed * 60);
          break;
        case 's':
          old.push(parsed);
          break;
        default:
          break;
        }

        return old;
      }, []);

      return durationsAsSeconds.reduce((old, neu) => old + neu);
    },
    emitError(e) {
      this.$emit('error', e);
    },
    async test() {
      if ( typeof this.$refs.configComponent?.test === 'function' ) {
        let errors = [];

        try {
          const res = await this.$refs.configComponent.test();

          if ( !res || res?.errors) {
            if (res?.errors) {
              errors = res.errors;
            }
          }
        } catch (e) {
          errors = [e];
        }

        return errors;
      }
    },
    // handle emitted matched machine inventories on selector so that machine count
    // on machine pool can be kept up to date
    // (only used on Elemental because it comes from "machineinventoryselectortemplate" machine-config)
    updateMachineCount(val) {
      this.value.pool.quantity = val || 1;
    },

    expandAdvanced() {
      this.advancedExpanded = true;
    },

    // Propagate up validation status for this Machine Pool
    validationChanged(val) {
      this.$emit('validationChanged', val);
    }
  }
};
</script>

<template>
  <RcContentGroup>
    <Banner
      v-if="value.pool.hostnameLengthLimit"
      color="info"
      class="m-0"
    >
      <div class="text">
        {{ t('cluster.machinePool.truncationPool', { limit: value.pool.hostnameLengthLimit }) }}
      </div>
    </Banner>
    <div class="input-row">
      <LabeledInput
        v-model:value="value.pool.name"
        :mode="mode"
        :label="t('cluster.machinePool.name.label')"
        :required="true"
        :disabled="!value.config || !!value.config.id || busy"
        :require-dirty="false"
        :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.NAME)"
        class="half"
        data-testid="machine-pool-name-input"
      />
    </div>
    <div class="input-row">
      <LabeledInput
        v-if="!isAutoscalerFeatureEnabled || !isAutoscalerEnabled"
        v-model:value.number="value.pool.quantity"
        :mode="mode"
        :label="t('cluster.machinePool.quantity.label')"
        :disabled="busy"
        type="number"
        min="0"
        :required="true"
        :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.QUANTITY)"
        class="half"
        data-testid="machine-pool-quantity-input"
      />
      <LabeledInput
        v-else
        :value="t('cluster.machinePool.autoscaler.machineCountValueOverride')"
        :mode="mode"
        :label="t('cluster.machinePool.quantity.label')"
        :disabled="true"
        :required="true"
        class="half"
        data-testid="machine-pool-quantity-input"
      />
    </div>
    <RcContentGroup
      role="group"
      :aria-label="t('cluster.machinePool.role.label')"
    >
      <h4 class="m-0">
        {{ t('cluster.machinePool.role.label') }}
      </h4>
      <Checkbox
        v-model:value="value.pool.etcdRole"
        :mode="mode"
        :label="t('cluster.machinePool.role.etcd')"
        :disabled="isWindows || busy"
        :aria-describedby="`${ uuid }-role-etcd`"
      >
        <template #extra>
          <span
            :id="`${ uuid }-role-etcd`"
            class="checkbox-help text-deemphasized"
          >
            <t
              k="cluster.machinePool.role.description.etcd"
              raw
            />
          </span>
        </template>
      </Checkbox>
      <Checkbox
        v-model:value="value.pool.controlPlaneRole"
        :mode="mode"
        :label="t('cluster.machinePool.role.controlPlane')"
        :disabled="isWindows || busy"
        :aria-describedby="`${ uuid }-role-controlPlane`"
      >
        <template #extra>
          <span
            :id="`${ uuid }-role-controlPlane`"
            class="checkbox-help text-deemphasized"
          >
            <t
              k="cluster.machinePool.role.description.controlPlane"
              raw
            />
          </span>
        </template>
      </Checkbox>
      <Checkbox
        v-model:value="value.pool.workerRole"
        :mode="mode"
        :label="t('cluster.machinePool.role.worker')"
        :disabled="busy"
        :aria-describedby="`${ uuid }-role-worker`"
      >
        <template #extra>
          <span
            :id="`${ uuid }-role-worker`"
            class="checkbox-help text-deemphasized"
          >
            <t
              k="cluster.machinePool.role.description.worker"
              raw
            />
          </span>
        </template>
      </Checkbox>
    </RcContentGroup>
    <component
      :is="configComponent"
      v-if="value.config && configComponent"
      ref="configComponent"
      v-model:is-ipv6="value.isIpv6"
      v-model:is-dualStack="value.isDualStack"
      :cluster="cluster"
      :infrastructure-cluster="infrastructureCluster"
      :uuid="uuid"
      :mode="mode"
      :value="value.config"
      :provider="provider"
      :credential-id="credentialId"
      :project-id="projectId"
      :pool-index="idx"
      :pool-id="poolId"
      :pool-create-mode="value.create"
      :machine-pools="machinePools"
      :busy="busy"
      @error="emitError"
      @updateMachineCount="updateMachineCount"
      @expandAdvanced="expandAdvanced"
      @validationChanged="validationChanged"
    />
    <Banner
      v-else-if="value.configMissing"
      color="error"
      class="m-0"
      label-key="cluster.machinePool.configNotFound"
    />
    <Banner
      v-else
      color="info"
      class="m-0"
      label-key="cluster.machinePool.noAccessBanner"
    />

    <RcSection
      v-if="!hideAdvanced"
      v-model:expanded="advancedExpanded"
      type="secondary"
      mode="with-header"
      :expandable="true"
      :title="t('cluster.tabs.advanced')"
      data-testid="machine-pool-advanced"
    >
      <portal-target
        :name="'advanced-' + uuid"
        multiple
      />

      <RcSection
        type="secondary"
        mode="with-header"
        :expandable="true"
        :title="t('cluster.machinePool.automation.label')"
      >
        <div>
          <t
            k="cluster.machinePool.autoReplace.description"
            :distro="distro"
            raw
            class="text-deemphasized"
          />
          <div class="input-row mmt-1">
            <UnitInput
              v-model:value="unhealthyNodeTimeoutInteger"
              :label="t('cluster.machinePool.autoReplace.label')"
              :hide-arrows="true"
              :placeholder="t('containerResourceLimit.cpuPlaceholder')"
              :mode="mode"
              :output-modifier="true"
              :base-unit="t('cluster.machinePool.autoReplace.unit')"
              :disabled="busy"
              class="half"
              @update:value="value.pool.unhealthyNodeTimeout = `${unhealthyNodeTimeoutInteger}s`"
            />
          </div>
        </div>
        <Checkbox
          v-model:value="value.pool.drainBeforeDelete"
          :mode="mode"
          :label="t('cluster.machinePool.drain.label')"
          :disabled="busy"
        />
      </RcSection>

      <RcSection
        v-if="isAutoscalerFeatureEnabled"
        type="secondary"
        mode="with-header"
        :expandable="true"
        :title="t('cluster.machinePool.autoscaler.heading')"
      >
        <Banner
          v-if="value.pool.etcdRole || value.pool.controlPlaneRole"
          color="warning"
          class="m-0"
          label-key="cluster.machinePool.autoscaler.etcdControlPlaneWarning"
        />
        <Checkbox
          v-model:value="isAutoscalerEnabled"
          :mode="mode"
          :label="t('cluster.machinePool.autoscaler.enable', undefined, true)"
          :disabled="value.pool.etcdRole || value.pool.controlPlaneRole || busy"
        />
        <template v-if="isAutoscalerPaused">
          <Banner
            color="info"
            class="m-0"
            :label="t('cluster.machinePool.autoscaler.pause.pausedBanner')"
            data-testid="autoscaler-paused-banner"
          />
          <div class="input-row">
            <UnitInput
              :value="pausedAutoscalerRange.min"
              :label="t('cluster.machinePool.autoscaler.min')"
              :hide-arrows="true"
              :mode="mode"
              :base-unit="t('cluster.machinePool.autoscaler.baseUnit')"
              :disabled="true"
              data-testid="autoscaler-paused-min"
            />
            <UnitInput
              :value="pausedAutoscalerRange.max"
              :label="t('cluster.machinePool.autoscaler.max')"
              :hide-arrows="true"
              :mode="mode"
              :base-unit="t('cluster.machinePool.autoscaler.baseUnit')"
              :disabled="true"
              data-testid="autoscaler-paused-max"
            />
          </div>
        </template>
        <div
          v-if="isAutoscalerEnabled"
          class="input-row"
        >
          <UnitInput
            v-model:value="value.pool.autoscalingMinSize"
            :label="t('cluster.machinePool.autoscaler.min')"
            :hide-arrows="true"
            :placeholder="t('containerResourceLimit.cpuPlaceholder')"
            :mode="mode"
            :base-unit="t('cluster.machinePool.autoscaler.baseUnit')"
            :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.AUTOSCALER_MIN)"
            :disabled="value.pool.etcdRole || value.pool.controlPlaneRole || busy"
          />
          <UnitInput
            v-model:value="value.pool.autoscalingMaxSize"
            :label="t('cluster.machinePool.autoscaler.max')"
            :hide-arrows="true"
            :placeholder="t('containerResourceLimit.cpuPlaceholder')"
            :mode="mode"
            :base-unit="t('cluster.machinePool.autoscaler.baseUnit')"
            :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.AUTOSCALER_MAX)"
            :disabled="value.pool.etcdRole || value.pool.controlPlaneRole || busy"
          />
        </div>
      </RcSection>

      <RcKeyValue
        v-model:value="value.pool.labels"
        :add-label="t('labels.addLabel')"
        :disabled="busy"
        :mode="mode"
        :title="t('cluster.machinePool.labels.label')"
        :read-allowed="false"
        :value-can-be-empty="true"
        add-icon="icon-plus"
        use-rc-button
      />

      <Taints
        v-model:value="value.pool.taints"
        :mode="mode"
        :disabled="busy"
        add-icon="icon-plus"
        :use-rc-button="true"
      />

      <portal-target
        :name="'advanced-footer-' + uuid"
        multiple
      />
    </RcSection>
  </RcContentGroup>
</template>

<style lang="scss" scoped>
  // matches the Checkbox description text, which this help replaces so that it can hold a link
  .checkbox-help {
    font-size: 12px;
  }
</style>
