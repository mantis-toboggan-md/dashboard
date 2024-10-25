<script lang="ts">
import { PropType, defineComponent } from 'vue';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { getGKEVersions, getGKEClusters } from '../util/gcp';

import semver from 'semver';

import type { getGKEVersionsResponse, getGKEClustersResponse } from '../types/gcp.d.ts';
import debounce from 'lodash/debounce';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { mapGetters } from 'vuex';
import KeyValue from '@shell/components/form/KeyValue.vue';

export default defineComponent({
  name: 'GKEConfig',

  emits: ['update:kubernetesVersion', 'update:defaultImageType', 'error', 'update:labels'],

  components: {
    LabeledSelect,
    KeyValue
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    isNewOrUnprovisioned: {
      type:    Boolean,
      default: true
    },

    zone: {
      type:    String,
      default: ''
    },

    region: {
      type:    String,
      default: ''
    },

    cloudCredentialId: {
      type:    String,
      default: ''
    },

    projectId: {
      type:    String,
      default: ''
    },

    originalVersion: {
      type:    String,
      default: ''
    },

    clusterId: {
      type:    String,
      default: ''
    },

    clusterName: {
      type:    String,
      default: ''
    },

    kubernetesVersion: {
      type:    String,
      default: ''
    },

    defaultImageType: {
      type:    String,
      default: ''
    },
    // these are gkeconfig.labels NOT normancluster.labels (handled in another accordion)
    labels: {
      type:    Object as PropType<{[key:string]: string}>,
      default: () => {
        return {};
      }
    },
  },

  created() {
    this.debouncedLoadGCPData = debounce(this.loadGCPData, 200);
    this.debouncedLoadGCPData();
  },

  data() {
    const t = this.$store.getters['i18n/t'];
    const supportedVersionRange = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;

    return {
      debouncedLoadGCPData: (zones = true) => {},
      loadingVersions:      false,

      versionsResponse: {} as getGKEVersionsResponse,
      /**
       * these are NOT cluster objects in the Rancher cluster (management.cattle.io.cluster provisioning.cattle.io.cluster etc)
       * this is a list of clusters in the user's GCP project, which, on edit, will include the current cluster
       * on edit, this gcp representation of the cluster is checked for a release channel to determine which k8s versions to offer
       */
      clustersResponse: {} as getGKEClustersResponse,
      supportedVersionRange,
    };
  },

  watch: {
    versionOptions(neu) {
      if (neu && neu.length && !this.kubernetesVersion) {
        this.$emit('update:kubernetesVersion', this.versionOptions[0].value);
      }
    },

    cloudCredentialId() {
      this.debouncedLoadGCPData();
    },

    projectId() {
      this.debouncedLoadGCPData();
    },

    region: {
      handler(neu) {
        if (!!neu) {
          this.debouncedLoadGCPData(false);
        }
      },
      immediate: true
    },

    zone: {
      handler(neu) {
        if (!!neu) {
          this.debouncedLoadGCPData(false);
        }
      },
      immediate: true
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isCreate(): boolean {
      return this.mode === _CREATE;
    },

    isView(): boolean {
      return this.mode === _VIEW;
    },

    releaseChannel(): string | undefined {
      const cluster = (this.clustersResponse?.clusters || []).find((c) => c.name === this.clusterName);

      return cluster?.releaseChannel?.channel;
    },

    // if editing an existing cluster use versions from relevant release channel
    // filter based off supported version range
    // if current cluster version is outside of supported range, show it anyway
    // disable versions more than one minor version away from the current version
    versionOptions(): {label: string, value: string, disabled?:boolean}[] {
      let out: {label: string, value: string, disabled?:boolean}[] = [];
      let versions: string[] = [];
      const { supportedVersionRange, originalVersion } = this;
      const originalMinorVersion = !!originalVersion ? semver.parse(originalVersion).minor : null;

      if (!!this.releaseChannel) {
        versions = (this.versionsResponse?.channels || []).find((ch) => ch.channel === this.releaseChannel)?.validVersions || [];
      }
      if (!versions || !versions.length) {
        versions = this.versionsResponse?.validMasterVersions || [];
      }

      out = versions.reduce((opts, v) => {
        if (supportedVersionRange && !semver.satisfies(semver.coerce(v), supportedVersionRange)) {
          return opts;
        }
        if (originalVersion && !semver.gte(v, originalVersion)) {
          return opts;
        }
        if (v === originalVersion) {
          opts.push({ label: `${ v } (${ this.t('gke.version.current') })`, value: v });
        } else if (originalMinorVersion && originalMinorVersion < (semver.parse(v, { includePrerelease: true }).minor - 1)) {
          opts.push({
            label: v, value: v, disabled: true
          });
        } else {
          opts.push({ label: v, value: v });
        }

        return opts;
      }, [] as {label: string, value: string, disabled?:boolean}[]);

      if (originalVersion && !semver.satisfies(semver.coerce(originalVersion), supportedVersionRange)) {
        out.push({ label: `${ originalVersion } (${ this.t('gke.version.current') })`, value: originalVersion });
      }

      return out;
    },
  },
  methods: {
    // when credential/region/zone change, fetch dependent resources from gcp
    loadGCPData() {
      if (!this.isView) {
        this.loadingVersions = true;
        this.getVersions();
        // gcp clusters are fetched on edit to check this cluster's release channel & offer appropriate k8s versions
        if (this.mode !== _CREATE) {
          this.getClusters();
        }
      }
    },

    async getVersions() {
      try {
        const res = await getGKEVersions(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region });

        this.versionsResponse = res;
        if (res.defaultImageType) {
          this.$emit('update:defaultImageType', res.defaultImageType);
        }
      } catch (err:any) {
        this.$emit('error', err);
      }

      this.loadingVersions = false;
    },

    async getClusters() {
      try {
        const res = await getGKEClusters(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }, this.clusterId);

        this.clustersResponse = res;
      } catch (err:any) {
        this.$emit('error', err);
      }
    },
  },
});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledSelect
          :options="versionOptions"
          label-key="gke.version.label"
          :value="kubernetesVersion"
          :tooltip="isCreate? '' :t('gke.version.tooltip')"
          :loading="loadingVersions"
          data-testid="gke-version-select"
          :mode="mode"
          @selecting="$emit('update:kubernetesVersion', $event.value)"
        />
      </div>
    </div>
    <div class="row mt-20 mb-10">
      <div class="col span-12">
        <KeyValue
          :mode="mode"
          :value="labels"
          :as-map="true"
          :title="t('gke.clusterLabels.label')"
          :add-label="t('gke.clusterLabels.add')"
          @update:value="$emit('update:labels', $event)"
        >
          <template #title>
            <!-- keyvalue title by default is an h3 and looks bad with the accordion header also being an h3 -->
            <h4>
              {{ t('gke.clusterLabels.label') }}
            </h4>
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.location-row{
  display: flex;
  align-items: center;
}
.extra-zones  {
  display: flex;
  flex-direction: column;
}
</style>
