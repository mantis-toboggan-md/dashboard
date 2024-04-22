<script lang="ts">
import semver from 'semver';

import { mapGetters } from 'vuex';
import { _CREATE } from '@shell/config/query-params';
import { defineComponent } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

import { getGKEVersions, getGKENetworks, getGKESubnetworks, getGKEClusters } from '../util/gcp';
import type { getGKEVersionsResponse, getGKEClustersResponse } from '../types/gcp.d.ts';
import { debounce } from 'lodash';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default defineComponent({
  name: 'GKEConfig',

  components: { LabeledSelect },

  props: {
    mode: {
      type:    String,
      default: _CREATE
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
    kubernetesVersion: {
      type:    String,
      default: ''
    },
    clusterName: {
      type:    String,
      default: ''
    }
  },

  created() {
    this.debouncedLoadGCPData = debounce(this.loadGCPData, 200);
    this.debouncedLoadGCPData();
  },

  data() {
    const supportedVersionRange = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;

    return {
      debouncedLoadGCPData: () => {},

      loadingVersions:    false,
      loadingNetworks:    false,
      loadingSubnetworks: false,

      supportedVersionRange,
      versionsResponse: {} as getGKEVersionsResponse,
      clustersResponse: {} as getGKEClustersResponse,
      networks:         [],
      subnetworks:      []
    };
  },

  watch: {
    cloudCredentialId() {
      this.debouncedLoadGCPData();
    },
    zone() {
      this.debouncedLoadGCPData();
    },
    region() {
      this.debouncedLoadGCPData();
    },
    projectId() {
      this.debouncedLoadGCPData();
    },
    versionOptions(neu) {
      if (neu && neu.length && !this.kubernetesVersion) {
        this.$emit('update:kubernetesVersion', this.versionOptions[0].value);
      }
    }
  },

  methods: {
    // when credential/region/zone change, fetch dependent resources from gcp
    loadGCPData() {
      this.loadingVersions = true;
      this.loadingNetworks = true;
      this.loadingSubnetworks = true;
      this.getVersions();
      this.getNetworks();
      this.getSubnetworks();
      if (this.mode !== _CREATE) {
        this.getClusters();
      }
    },

    getVersions() {
      getGKEVersions(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }).then((res) => {
        // TODO nb default version
        this.versionsResponse = res;
      }).catch((err) => {
        this.$emit('error', err);
      });
    },

    getNetworks() {
      getGKENetworks(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }).then((res) => {
        console.log('gke networks: ', res);
      }).catch((err) => {
        this.$emit('error', err);
      });
    },

    getSubnetworks() {
      let { region, zone } = this;

      if (!region && !!zone) {
        region = `${ zone.split('-')[0] }-${ zone.split('-')[1] }`;
      }
      getGKESubnetworks(this.$store, this.cloudCredentialId, this.projectId, { region }).then((res) => {
        console.log('gke subnetworks: ', res);
      }).catch((err) => {
        this.$emit('error', err);
      });
    },

    getClusters() {
      getGKEClusters(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }, this.clusterId).then((res) => {
        this.clustersResponse = res;
      }).catch((err) => {
        this.$emit('error', err);
      });
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    releaseChannel(): string | null {
      const cluster = (this.clustersResponse?.clusters || []).find((c) => c.name === this.clusterName);

      return cluster?.releaseChannel?.channel;
    },

    // if editing an existing cluster use versions from relevant release channel
    // filter based off supported version range
    // if current cluster version is outside of supported range, show it anyway
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
    }
  },

});
</script>

<template>
  <div class="row mb-10">
    <div class="col span-6">
      <!-- TODO nb warn about minor version upgrades -->
      <LabeledSelect
        :options="versionOptions"
        label-key="gke.version.label"
        :value="kubernetesVersion"
        @selecting="$emit('update:kubernetesVersion', $event.value)"
      />
    </div>
  </div>
</template>
