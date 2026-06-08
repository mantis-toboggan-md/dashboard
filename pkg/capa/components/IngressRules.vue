<script setup lang="ts">
import { toRefs, computed, ref, watch } from 'vue';
import { _CREATE } from '@shell/config/query-params';
import { useStore } from 'vuex';
import * as AWS from '@shell/types/aws-sdk';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import RcSection from '@components/RcSection/RcSection.vue';
import RcSectionActions from '@components/RcSection/RcSectionActions.vue';
import { useI18n } from '@shell/composables/useI18n';
import ipaddr from 'ipaddr.js';
import { removeEmptyFields } from '../utils';

defineOptions({ name: 'IngressRules' });

const emit = defineEmits(['update:value']);

interface Props {
  value: any[];
  mode?: string;
  region?: string;
  credentialId?: any;
  vpcId?: string;
  allowTargets?: boolean;
  titlePrefix?: string;
  disableAdd?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode:         _CREATE,
  value:        () => [],
  region:       '',
  credentialId: null,
  vpcId:        '',
  allowTargets: true,
  titlePrefix:  '',
  disableAdd:   false
});

const {
  value, mode, region, credentialId, vpcId, allowTargets
} = toRefs(props);

const store = useStore();
const ec2Client = ref(null);
const securityGroupInfo = ref<AWS.SecurityGroup[]>([]);
const loadingSecurityGroups = ref(false);
const { t } = useI18n(store);

// TODO nb shared export
const SECURITY_GROUP_ROLES = [
  { label: 'bastion', value: 'bastion' },
  { label: 'node', value: 'node' },
  { label: 'controlplane', value: 'controlplane' },
  { label: 'apiserver-lb', value: 'apiserver-lb' },
  { label: 'lb', value: 'lb' }
];

// TODO nb localization
const PROTOCOLS = computed(() => [
  { label: t('capa.clusterConfig.network.ingressRules.protocols.all'), value: '-1' },
  { label: t('capa.clusterConfig.network.ingressRules.protocols.tcp'), value: 'tcp' },
  { label: t('capa.clusterConfig.network.ingressRules.protocols.udp'), value: 'udp' },
  { label: t('capa.clusterConfig.network.ingressRules.protocols.icmp'), value: 'icmp' },
  { label: t('capa.clusterConfig.network.ingressRules.protocols.icmpv6'), value: '58' },
  { label: t('capa.clusterConfig.network.ingressRules.protocols.ipInIp'), value: '4' },
  { label: t('capa.clusterConfig.network.ingressRules.protocols.esp'), value: '50' }
]);

const defaultRule = {
  description: '',
  protocol:    'tcp',
  //   fromPort:    0,
  //   toPort:      0,

};

const defaultRuleWithTargets = {
  ...defaultRule,
  cidrBlocks:               [],
  sourceSecurityGroupIDs:   [],
  sourceSecurityGroupRoles: []
};

const localValue = computed({
  get: () => value.value || [],
  set: (neu) => {
    emit('update:value', neu);
  }
});

const securityGroupOptions = computed(() => {
  return securityGroupInfo.value.reduce((opts, sg) => {
    if (!vpcId.value || sg.VpcId === vpcId.value) {
      opts.push({
        label: `${ sg.GroupName } (${ sg.GroupId })`,
        value: sg.GroupId
      });
    }

    return opts;
  }, [] as any);
});

async function getSecurityGroups() {
  loadingSecurityGroups.value = true;

  if (!ec2Client.value) {
    securityGroupInfo.value = [];
    loadingSecurityGroups.value = false;

    return;
  }

  const securityGroups = await ec2Client.value.describeSecurityGroups({ });

  securityGroupInfo.value = securityGroups?.SecurityGroups || [];
  loadingSecurityGroups.value = false;
}

function addRule() {
  const rules = [...localValue.value];
  const newRule = allowTargets.value ? defaultRuleWithTargets : defaultRule;

  rules.push({ ...newRule });
  localValue.value = rules;
}

function removeRule(index: number) {
  const rules = [...localValue.value];

  rules.splice(index, 1);
  localValue.value = rules;
}

function updateRule(index: number, field: string, newValue: any) {
  const rules = [...localValue.value];

  // remove empty arrays of security groups to pass be validation
  rules[index] = removeEmptyFields({ ...rules[index], [field]: newValue });
  localValue.value = rules;
}

function updateCidrString(index: number, field: string, stringValue: string) {
  const rules = [...localValue.value];
  const arrayValue = getCidrArray(stringValue);

  rules[index] = removeEmptyFields({ ...rules[index], [field]: arrayValue });
  localValue.value = rules;
}

function getCidrString(cidrArray: string[]): string {
  return (cidrArray || []).join(', ');
}

// Track the raw string the user is typing in each rule
// Without this the input handler will try to parse the comma-separated list into cidr blocks, stripping trailing commas and
// making it impossible to type a comma-separated list of CIDRs
const localCidr = ref<Record<number, string>>({});

function getLocalCidrValue(index: number, cidrArray: string[]): string {
  return index in localCidr.value ? localCidr.value[index] : getCidrString(cidrArray);
}

function handleCidrInput(index: number, field: string, stringValue: string) {
  localCidr.value = { ...localCidr.value, [index]: stringValue };
}

function updateCidrFromLocalValue(index: number, field: string) {
  const local = localCidr.value[index];

  if (local !== undefined) {
    updateCidrString(index, field, local);
    const { [index]: _, ...rest } = localCidr.value;

    localCidr.value = rest;
  }
}

function getCidrArray(cidrString: string) {
  return cidrString
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function allowCidr({ cidrBlocks = [], sourceSecurityGroupIDs = [], sourceSecurityGroupRoles = [] }) {
  return (!sourceSecurityGroupIDs.length && !sourceSecurityGroupRoles.length) || cidrBlocks.length;
}

function allowSecurityGroups({ cidrBlocks = [], sourceSecurityGroupIDs = [] }) {
  return vpcId.value && (!cidrBlocks.length || sourceSecurityGroupIDs.length);
}

function allowSecurityGroupRoles({ cidrBlocks = [], sourceSecurityGroupRoles = [] }) {
  return !cidrBlocks.length || sourceSecurityGroupRoles.length;
}

// TODO nb shared validator function
function validateCidrString(cidrBlockString = '') {
  const cidrBlocks = getCidrArray(cidrBlockString) || [];

  try {
    return !!cidrBlocks.find((cidr) => !ipaddr.isValidCIDR(cidr)) ? 'Invalid CIDR format' : null;
  } catch {
    return 'Invalid CIDR format';
  }
}

watch([
  () => region.value,
  () => credentialId.value,
], async([newRegion, newCredentialId]) => {
  if (!!newRegion && !!newCredentialId) {
    ec2Client.value = await store.dispatch('aws/ec2', {
      region:            region.value,
      cloudCredentialId: credentialId.value
    });

    getSecurityGroups();
  } else {
    securityGroupInfo.value = [];
  }
}, { immediate: true });
</script>

<template>
  <div>
    <RcSection
      v-for="(rule, index) in localValue"
      :key="index"
      class="mb-20"
      type="secondary"
      mode="with-header"
      :expandable="false"
      :title="titlePrefix ? t('capa.clusterConfig.network.ingressRules.ruleTitle', {index:index+1, titlePrefix}) : ''"
    >
      <template #actions>
        <RcSectionActions
          :actions="[
            { icon: 'trash', ariaLabel: t('capa.clusterConfig.network.ingressRules.deleteRule'), action: () => removeRule(index) },
          ]"
        />
      </template>
      <div>
        <div class="row">
          <div class="col span-12">
            <label class="text-label">{{ t('capa.clusterConfig.network.ingressRules.description') }}</label>
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-12">
            <LabeledInput
              :value="rule.description"
              :mode="mode"
              @update:value="updateRule(index, 'description', $event)"
            />
          </div>
        </div>
        <div
          class="row"
        >
          <div class="col span-1">
            <label class="text-label">{{ t('capa.clusterConfig.network.ingressRules.protocol') }}</label>
          </div>
          <div class="col span-1">
            <label class="text-label">{{ t('capa.clusterConfig.network.ingressRules.fromPort') }}</label>
          </div>
          <div class="col span-1">
            <label class="text-label">{{ t('capa.clusterConfig.network.ingressRules.toPort') }}</label>
          </div>
          <div
            v-if="allowTargets"
            class="col span-3"
          >
            <label class="text-label">{{ t('capa.clusterConfig.network.ingressRules.cidrBlocks') }}</label>
          </div>
          <div
            v-if="allowTargets"
            class="col span-3"
          >
            <label class="text-label">{{ t('capa.clusterConfig.network.ingressRules.sourceSecurityGroupIDs') }}</label>
          </div>
          <div
            v-if="allowTargets"
            class="col span-3"
          >
            <label class="text-label">{{ t('capa.clusterConfig.network.ingressRules.sourceSecurityGroupRoles') }}</label>
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-1">
            <LabeledSelect
              :value="rule.protocol"
              :mode="mode"
              :options="PROTOCOLS"
              @update:value="updateRule(index, 'protocol', $event)"
            />
          </div>
          <div class="col span-1">
            <LabeledInput
              :value="rule.fromPort"
              :mode="mode"
              @update:value="updateRule(index, 'fromPort', parseInt($event) || 0)"
            />
          </div>
          <div class="col span-1">
            <LabeledInput
              :value="rule.toPort"
              :mode="mode"
              @update:value="updateRule(index, 'toPort', parseInt($event) || 0)"
            />
          </div>
          <div
            v-if="allowTargets"
            class="col span-3"
          >
            <LabeledInput
              :disabled="!allowCidr(rule)"
              :value="getLocalCidrValue(index, rule.cidrBlocks)"
              :mode="mode"
              :placeholder="t('capa.clusterConfig.network.ingressRules.cidrBlocksPlaceholder')"
              :rules="[validateCidrString]"
              @update:value="handleCidrInput(index, 'cidrBlocks', $event)"
              @blur="updateCidrFromLocalValue(index, 'cidrBlocks')"
            />
          </div>
          <div
            v-if="allowTargets"
            class="col span-3"
          >
            <LabeledSelect
              :disabled="!allowSecurityGroups(rule)"
              :value="rule.sourceSecurityGroupIDs || []"
              :mode="mode"
              :options="securityGroupOptions"
              :loading="loadingSecurityGroups"
              :placeholder="!vpcId? t('capa.clusterConfig.network.securityGroups.selectVpc') : ''"
              :multiple="true"
              @update:value="updateRule(index, 'sourceSecurityGroupIDs', $event)"
            />
          </div>
          <div
            v-if="allowTargets"
            class="col span-3"
          >
            <LabeledSelect
              :disabled="!allowSecurityGroupRoles(rule)"
              :value="rule.sourceSecurityGroupRoles || []"
              :mode="mode"
              :options="SECURITY_GROUP_ROLES"
              :multiple="true"
              @update:value="updateRule(index, 'sourceSecurityGroupRoles', $event)"
            />
          </div>
        </div>
      </div>

      <!-- <div class="row mb-10" /> -->

      <!-- <div class="row mb-10">
        <div class="col span-12">
          <LabeledInput
            :value="getCidrString(rule.ipv6CidrBlocks)"
            :mode="mode"
            label="IPv6 CIDR Blocks"
            placeholder="e.g., 2001:db8::/32, fd00::/8"
            @update:value="updateCidrString(index, 'ipv6CidrBlocks', $event)"
          />
        </div>
      </div> -->

      <!-- <div class="row mb-10">
        <div class="col span-12">
          <LabeledSelect
            :value="rule.sourceSecurityGroupRoles || []"
            :mode="mode"
            :options="SECURITY_GROUP_ROLES"
            :multiple="true"
            label="Source Security Group Roles"
            @update:value="updateRule(index, 'sourceSecurityGroupRoles', $event)"
          />
        </div>
      </div> -->

      <!-- <div class="row mb-10">
        <div class="col span-12">
          <Checkbox
            :value="rule.natGatewaysIPsSource"
            :mode="mode"
            label="Use NAT Gateway IPs as Source"
            @update:value="updateRule(index, 'natGatewaysIPsSource', $event)"
          />
        </div>
      </div> -->
    </RcSection>

    <div
      v-if="mode !== 'view'"
      class="row"
    >
      <div class="col span-12">
        <button
          :disabled="disableAdd"
          type="button"
          class="btn btn-sm role-secondary"
          @click="addRule"
        >
          {{ t('capa.clusterConfig.network.ingressRules.addRule') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.remove-button {
  display: flex;
  justify-content: end;
  margin-bottom: 16px;
}
</style>
