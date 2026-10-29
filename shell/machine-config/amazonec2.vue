<script>
import { Banner } from '@components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import RcKeyValue from '@shell/components/form/RcKeyValue.vue';
import UnitInput from '@shell/components/form/UnitInput';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { RcSection } from '@components/RcSection';
import { RcContentGroup } from '@components/Layout';
import { NORMAN } from '@shell/config/types';
import { convertStringToKV, convertKVToString } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';
import { stringify, exceptionToErrorsArray, formatAWSError } from '@shell/utils/error';
import EC2Networking from './components/EC2Networking.vue';

const DEFAULT_GROUP = 'rancher-nodes';

export default {
  components: {
    Banner, LabeledInput, LabeledSelect, Checkbox, RadioGroup, UnitInput, RcKeyValue, RcSection, RcContentGroup, EC2Networking,
  },

  mixins: [CreateEditView],

  emits: ['validationChanged', 'update:isIpv6', 'update:isDualStack'],

  props: {
    uuid: {
      type:     String,
      required: true,
    },

    cluster: {
      type:    Object,
      default: () => ({})
    },

    credentialId: {
      type:     String,
      required: true,
    },

    disabled: {
      type:    Boolean,
      default: false
    },

    isIpv6: {
      type:    Boolean,
      default: false
    },

    isDualStack: {
      type:    Boolean,
      default: false
    },

    machinePools: {
      type:    Array,
      default: () => []
    },

    poolCreateMode: {
      type:    Boolean,
      default: true
    },
  },

  data() {
    return {
      credential:            null,
      instanceInfo:          null,
      regionInfo:            null,
      canReadKms:            null,
      kmsInfo:               null,
      tags:                  null,
      loadedRegionalFor:     null,
      zoneInfo:              null,
      vpcInfo:               null,
      subnetInfo:            null,
      securityGroupInfo:     null,
      securityGroupMode:     null,
      loadingCredential:     false,
      loadingRegions:        false,
      loadingInstanceTypes:  false,
      loadingZones:          false,
      loadingVpcs:           false,
      loadingSecurityGroups: false,
      loadingKms:            false,
    };
  },

  created() {
    if ( !this.value.zone ) {
      this.value['zone'] = 'a';
    }

    if ( !this.value.instanceType ) {
      this.value['instanceType'] = this.$store.getters['aws/defaultInstanceType'];
    }

    this.initTags();

    if ( !this.value.securityGroup?.length ) {
      this.value['securityGroup'] = [DEFAULT_GROUP];
    }

    if ( this.value.securityGroup?.length === 1 && this.value.securityGroup[0] === DEFAULT_GROUP ) {
      this.securityGroupMode = 'default';
    } else {
      this.securityGroupMode = 'custom';
    }

    this.loadAwsData();
  },

  computed: {
    securityGroupLabels() {
      return [
        this.t('cluster.machineConfig.amazonEc2.securityGroup.mode.default', { defaultGroup: DEFAULT_GROUP }),
        this.t('cluster.machineConfig.amazonEc2.securityGroup.mode.custom')
      ];
    },

    isIamInstanceProfileNameRequired() {
      return this.cluster?.cloudProvider === 'aws';
    },

    instanceOptions() {
      let lastGroup;

      const out = [];

      for ( const row of this.instanceInfo || [] ) {
        if ( row.groupLabel !== lastGroup ) {
          out.push({
            kind:     'group',
            disabled: true,
            label:    row.groupLabel
          });

          lastGroup = row.groupLabel;
        }

        out.push({
          label: row['label'],
          value: row['apiName'],
        });
      }

      return out;
    },

    regionOptions() {
      if ( !this.regionInfo ) {
        return [];
      }

      return this.regionInfo.Regions.map((obj) => {
        return obj.RegionName;
      }).sort();
    },

    zoneOptions() {
      if ( !this.zoneInfo ) {
        return [];
      }

      return this.zoneInfo.AvailabilityZones.map((obj) => {
        return obj.ZoneName.substr(-1);
      }).sort();
    },

    securityGroupOptions() {
      if ( !this.securityGroupInfo ) {
        return [];
      }

      const out = this.securityGroupInfo.SecurityGroups.filter((obj) => {
        return obj.VpcId === this.value.vpcId;
      }).map((obj) => {
        return {
          label:       obj.GroupName,
          description: obj.GroupDescription,
          value:       obj.GroupName
        };
      });

      return sortBy(out, 'label');
    },

    kmsOptions() {
      if ( !this.kmsInfo ) {
        return [];
      }

      const out = this.kmsInfo.Keys.map((obj) => {
        return obj.KeyArn;
      }).sort();

      return out;
    },

    DEFAULT_GROUP() {
      return DEFAULT_GROUP;
    },

    distro() {
      return this.cluster?.isK3s ? 'k3s' : 'rke2';
    }
  },

  watch: {
    credentialId() {
      this.credential = null;
      this.regionInfo = null;
      this.loadedRegionalFor = null;
      this.loadAwsData();
    },

    'value.region'(neu) {
      if ( neu && neu !== this.loadedRegionalFor ) {
        this.loadRegionalData();
      }
    },

    securityGroupMode(val) {
      this.value.securityGroupReadonly = ( val !== 'default' );
    },
  },

  methods: {
    stringify,

    initTags() {
      this.tags = convertStringToKV(this.value.tags);
    },

    updateTags(tags) {
      this.value['tags'] = convertKVToString(tags);
    },

    test() {
      const errors = [];

      if (!this.value.subnetId && !this.value.vpcId) {
        errors.push(this.t('validation.required', { key: 'VPC/Subnet' }, true));
      }

      return { errors };
    },

    addError(e) {
      this.errors.push(...exceptionToErrorsArray(formatAWSError(e)));
    },

    ec2Client(region = this.value.region) {
      return this.$store.dispatch('aws/ec2', { region, cloudCredentialId: this.credentialId });
    },

    /**
     * Resolve the cloud credential, default the region from it, then load every AWS resource the form lists
     */
    async loadAwsData() {
      this.errors = [];

      if ( !this.credentialId ) {
        return;
      }

      await this.fetchCredential();

      if ( !this.value.region ) {
        this.value['region'] = this.credential?.decodedData.defaultRegion || this.$store.getters['aws/defaultRegion'];
      }

      await Promise.all([
        this.fetchRegions(),
        this.fetchInstanceTypes(),
        this.loadRegionalData(),
      ]);
    },

    /**
     * Load the AWS resources that belong to the selected region
     */
    loadRegionalData() {
      // set before the requests start, so the region watcher does not request the same region again
      this.loadedRegionalFor = this.value.region;
      this.zoneInfo = null;
      this.vpcInfo = null;
      this.subnetInfo = null;
      this.securityGroupInfo = null;
      this.kmsInfo = null;

      return Promise.all([
        this.fetchZones(),
        this.fetchVpcs(),
        this.fetchSecurityGroups(),
        this.fetchKmsKeys(),
      ]);
    },

    async fetchCredential() {
      if ( this.credential?.id === this.credentialId ) {
        return;
      }

      this.loadingCredential = true;
      try {
        this.credential = await this.$store.dispatch('rancher/find', { type: NORMAN.CLOUD_CREDENTIAL, id: this.credentialId });
      } catch (e) {
        this.credential = null;
      } finally {
        this.loadingCredential = false;
      }
    },

    async fetchRegions() {
      if ( this.regionInfo ) {
        return;
      }

      this.loadingRegions = true;
      try {
        const client = await this.ec2Client();

        this.regionInfo = await client.describeRegions({});
      } catch (e) {
        this.addError(e);
      } finally {
        this.loadingRegions = false;
      }
    },

    async fetchInstanceTypes() {
      if ( this.instanceInfo ) {
        return;
      }

      this.loadingInstanceTypes = true;
      try {
        const client = await this.ec2Client();

        this.instanceInfo = await this.$store.dispatch('aws/describeInstanceTypes', { client });
      } catch (e) {
        this.addError(e);
      } finally {
        this.loadingInstanceTypes = false;
      }
    },

    async fetchZones() {
      this.loadingZones = true;
      try {
        const client = await this.ec2Client();

        this.zoneInfo = await client.describeAvailabilityZones({});
      } catch (e) {
        this.addError(e);
      } finally {
        this.loadingZones = false;
      }
    },

    /**
     * VPCs and subnets are listed together in one select
     */
    async fetchVpcs() {
      this.loadingVpcs = true;
      try {
        const client = await this.ec2Client();
        const [vpcInfo, subnetInfo] = await Promise.all([
          client.describeVpcs({}),
          client.describeSubnets({}),
        ]);

        this.vpcInfo = vpcInfo;
        this.subnetInfo = subnetInfo;
      } catch (e) {
        this.addError(e);
      } finally {
        this.loadingVpcs = false;
      }
    },

    async fetchSecurityGroups() {
      this.loadingSecurityGroups = true;
      try {
        const client = await this.ec2Client();

        this.securityGroupInfo = await client.describeSecurityGroups({});
      } catch (e) {
        this.addError(e);
      } finally {
        this.loadingSecurityGroups = false;
      }
    },

    /**
     * Listing keys needs its own permission; without it the key ARN can still be typed in
     */
    async fetchKmsKeys() {
      this.loadingKms = true;
      try {
        const client = await this.$store.dispatch('aws/kms', { region: this.value.region, cloudCredentialId: this.credentialId });

        this.kmsInfo = await client.listKeys({});
        this.canReadKms = true;
      } catch (e) {
        this.canReadKms = false;
      } finally {
        this.loadingKms = false;
      }
    },
  },
};
</script>

<template>
  <RcContentGroup>
    <Banner
      v-for="(err, idx) in errors"
      :key="idx"
      color="error"
      class="m-0"
      :label="stringify(err)"
    />

    <div class="input-row">
      <LabeledSelect
        v-model:value="value.region"
        :mode="mode"
        :options="regionOptions"
        :loading="loadingCredential || loadingRegions"
        :required="true"
        :searchable="true"
        :disabled="disabled"
        :label="t('cluster.machineConfig.amazonEc2.region')"
        data-testid="amazonEc2__region"
      />
      <LabeledSelect
        v-model:value="value.zone"
        :mode="mode"
        :options="zoneOptions"
        :loading="loadingCredential || loadingZones"
        :required="true"
        :disabled="disabled"
        :label="t('cluster.machineConfig.amazonEc2.zone')"
        data-testid="amazonEc2__zone"
      />
    </div>
    <div class="input-row">
      <LabeledSelect
        v-model:value="value.instanceType"
        :mode="mode"
        :options="instanceOptions"
        :loading="loadingCredential || loadingInstanceTypes"
        :required="true"
        :selectable="option => !option.disabled"
        :searchable="true"
        :disabled="disabled"
        :label="t('cluster.machineConfig.amazonEc2.instanceType')"
        class="half"
        data-testid="amazonEc2__instanceType"
      >
        <template v-slot:option="opt">
          <template v-if="opt.kind === 'group'">
            <b>{{ opt.label }}</b>
          </template>
          <template v-else>
            <span class="pl-10">{{ opt.label }}</span>
          </template>
        </template>
      </LabeledSelect>
    </div>
    <div class="input-row">
      <UnitInput
        v-model:value="value.rootSize"
        output-as="string"
        :mode="mode"
        :disabled="disabled"
        :placeholder="t('cluster.machineConfig.amazonEc2.rootSize.placeholder')"
        :label="t('cluster.machineConfig.amazonEc2.rootSize.label')"
        :suffix="t('cluster.machineConfig.amazonEc2.rootSize.suffix')"
        class="half"
      />
    </div>

    <EC2Networking
      :key="value.region"
      v-model:enable-primary-ipv6="value.enablePrimaryIpv6"
      v-model:ipv6-address-count="value.ipv6AddressCount"
      v-model:ipv6-address-only="value.ipv6AddressOnly"
      v-model:http-protocol-ipv6="value.httpProtocolIpv6"
      v-model:vpc-id="value.vpcId"
      v-model:subnet-id="value.subnetId"
      :mode="mode"
      :vpc-info="vpcInfo"
      :subnet-info="subnetInfo"
      :loading="loadingCredential || loadingVpcs"
      :zone="value.zone"
      :region="value.region"
      :machine-pools="machinePools"
      :is-ipv6="isIpv6"
      :is-dual-stack="isDualStack"
      :disabled="disabled"
      :is-new="poolCreateMode"
      @update:is-ipv6="e=>$emit('update:isIpv6', e)"
      @update:is-dual-stack="e=>$emit('update:isDualStack', e)"
      @validation-changed="e=>$emit('validationChanged',e)"
    />

    <div>
      <t
        k="cluster.machineConfig.amazonEc2.iamInstanceProfile.description"
        raw
        class="text-deemphasized"
      />
      <div class="input-row mmt-1">
        <LabeledInput
          v-model:value="value.iamInstanceProfile"
          :mode="mode"
          :disabled="disabled"
          :required="isIamInstanceProfileNameRequired"
          :label="t('cluster.machineConfig.amazonEc2.iamInstanceProfile.label')"
          class="half"
        />
      </div>
    </div>

    <portal :to="'advanced-'+uuid">
      <div class="input-row">
        <LabeledInput
          v-model:value="value.ami"
          :mode="mode"
          :disabled="disabled"
          :placeholder="t('cluster.machineConfig.amazonEc2.ami.placeholder')"
          :label="t('cluster.machineConfig.amazonEc2.ami.label')"
          class="half"
        />
      </div>
      <div>
        <t
          k="cluster.machineConfig.amazonEc2.sshUser.description"
          raw
          class="text-deemphasized"
        />
        <div class="input-row mmt-1">
          <LabeledInput
            v-model:value="value.sshUser"
            :mode="mode"
            :label="t('cluster.machineConfig.amazonEc2.sshUser.label')"
            :disabled="!value.ami || disabled"
            :placeholder="t('cluster.machineConfig.amazonEc2.sshUser.placeholder')"
            class="half"
          />
        </div>
      </div>

      <RcSection
        type="secondary"
        mode="with-header"
        :expandable="true"
        :title="t('cluster.machineConfig.amazonEc2.securityGroup.title')"
      >
        <span
          v-if="!value.vpcId"
          class="text-deemphasized"
        >
          {{ t('cluster.machineConfig.amazonEc2.securityGroup.vpcId') }}
        </span>
        <RadioGroup
          v-model:value="securityGroupMode"
          name="securityGroupMode"
          :mode="mode"
          :disabled="!value.vpcId || disabled"
          :labels="securityGroupLabels"
          :options="['default','custom']"
        />
        <div
          v-if="value.vpcId && securityGroupMode === 'custom'"
          class="input-row"
        >
          <LabeledSelect
            v-model:value="value.securityGroup"
            :mode="mode"
            :disabled="!value.vpcId || disabled"
            :options="securityGroupOptions"
            :loading="loadingSecurityGroups"
            :searchable="true"
            :multiple="true"
            :taggable="true"
            :label="t('cluster.machineConfig.amazonEc2.securityGroup.title')"
            class="half"
            data-testid="amazonEc2__securityGroup"
          />
        </div>
      </RcSection>

      <div class="input-row">
        <LabeledInput
          v-model:value="value.volumeType"
          :mode="mode"
          :disabled="disabled"
          :label="t('cluster.machineConfig.amazonEc2.volumeType.label')"
          :placeholder="t('cluster.machineConfig.amazonEc2.volumeType.placeholder')"
          class="half"
        />
      </div>

      <RcContentGroup>
        <Checkbox
          v-model:value="value.encryptEbsVolume"
          :mode="mode"
          :label="t('cluster.machineConfig.amazonEc2.encryptEbsVolume')"
          :aria-describedby="`${ uuid }-encryptEbsVolume`"
        >
          <template #extra>
            <span
              :id="`${ uuid }-encryptEbsVolume`"
              class="checkbox-help text-deemphasized"
            >
              <t
                k="cluster.machineConfig.amazonEc2.description.encryptEbsVolume"
                raw
              />
            </span>
          </template>
        </Checkbox>
        <template v-if="value.encryptEbsVolume">
          <div
            v-if="canReadKms || loadingKms"
            class="input-row"
          >
            <LabeledSelect
              v-model:value="value.kmsKey"
              :mode="mode"
              :options="kmsOptions"
              :loading="loadingKms"
              :disabled="disabled"
              :label="t('cluster.machineConfig.amazonEc2.kmsKey.label')"
              class="half"
              data-testid="amazonEc2__kmsKey"
            />
          </div>
          <div v-else>
            <t
              k="cluster.machineConfig.amazonEc2.kmsKey.text"
              class="text-deemphasized"
            />
            <div class="input-row mmt-1">
              <LabeledInput
                v-model:value="value.kmsKey"
                :mode="mode"
                :disabled="disabled"
                :label="t('cluster.machineConfig.amazonEc2.kmsKey.label')"
                class="half"
              />
            </div>
          </div>
        </template>

        <Checkbox
          v-model:value="value.requestSpotInstance"
          :mode="mode"
          :label="t('cluster.machineConfig.amazonEc2.requestSpotInstance')"
          :aria-describedby="`${ uuid }-requestSpotInstance`"
        >
          <template #extra>
            <span
              :id="`${ uuid }-requestSpotInstance`"
              class="checkbox-help text-deemphasized"
            >
              <t
                k="cluster.machineConfig.amazonEc2.description.requestSpotInstance"
                raw
              />
            </span>
          </template>
        </Checkbox>
        <div
          v-if="value.requestSpotInstance"
          class="input-row"
        >
          <UnitInput
            v-model:value="value.spotPrice"
            output-as="string"
            :mode="mode"
            :disabled="disabled"
            :placeholder="t('cluster.machineConfig.amazonEc2.spotPrice.placeholder')"
            :label="t('cluster.machineConfig.amazonEc2.spotPrice.label')"
            :suffix="t('cluster.machineConfig.amazonEc2.spotPrice.suffix')"
            class="half"
          />
        </div>

        <Checkbox
          v-model:value="value.privateAddressOnly"
          :mode="mode"
          :disabled="disabled"
          :label="t('cluster.machineConfig.amazonEc2.privateAddressOnly')"
          :aria-describedby="`${ uuid }-privateAddressOnly`"
        >
          <template #extra>
            <span
              :id="`${ uuid }-privateAddressOnly`"
              class="checkbox-help text-deemphasized"
            >
              <t
                k="cluster.machineConfig.amazonEc2.description.privateAddressOnly"
                raw
              />
            </span>
          </template>
        </Checkbox>
        <Checkbox
          v-model:value="value.useEbsOptimizedInstance"
          :mode="mode"
          :disabled="disabled"
          :label="t('cluster.machineConfig.amazonEc2.useEbsOptimizedInstance')"
          :aria-describedby="`${ uuid }-useEbsOptimizedInstance`"
        >
          <template #extra>
            <span
              :id="`${ uuid }-useEbsOptimizedInstance`"
              class="checkbox-help text-deemphasized"
            >
              <t
                k="cluster.machineConfig.amazonEc2.description.useEbsOptimizedInstance"
                raw
              />
            </span>
          </template>
        </Checkbox>
        <Checkbox
          v-model:value="value.httpEndpoint"
          value-when-true="enabled"
          :mode="mode"
          :disabled="disabled"
          :label="t('cluster.machineConfig.amazonEc2.httpEndpoint')"
          :aria-describedby="`${ uuid }-httpEndpoint`"
        >
          <template #extra>
            <span
              :id="`${ uuid }-httpEndpoint`"
              class="checkbox-help text-deemphasized"
            >
              <t
                k="cluster.machineConfig.amazonEc2.description.httpEndpoint"
                raw
              />
            </span>
          </template>
        </Checkbox>
        <Checkbox
          v-model:value="value.httpTokens"
          value-when-true="required"
          :mode="mode"
          :disabled="!value.httpEndpoint || disabled"
          :label="t('cluster.machineConfig.amazonEc2.httpTokens')"
          :aria-describedby="`${ uuid }-httpTokens`"
        >
          <template #extra>
            <span
              :id="`${ uuid }-httpTokens`"
              class="checkbox-help text-deemphasized"
            >
              <t
                k="cluster.machineConfig.amazonEc2.description.httpTokens"
                raw
              />
            </span>
          </template>
        </Checkbox>
      </RcContentGroup>

      <RcKeyValue
        :value="tags"
        :mode="mode"
        :read-allowed="false"
        :title="t('cluster.machineConfig.amazonEc2.tagTitle')"
        :add-label="t('labels.addTag')"
        :disabled="disabled"
        add-icon="icon-plus"
        use-rc-button
        @update:value="updateTags"
      />
    </portal>
  </RcContentGroup>
</template>

<style lang="scss" scoped>
  // matches the Checkbox description text, which this help replaces so that it can hold a link
  .checkbox-help {
    font-size: 12px;
  }
</style>
