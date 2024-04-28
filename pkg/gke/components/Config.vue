<script lang="ts">
import semver from 'semver';

import { mapGetters } from 'vuex';
import { _CREATE } from '@shell/config/query-params';
import { defineComponent } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

import {
  getGKEVersions, getGKENetworks, getGKESubnetworks, getGKEClusters, getGKESharedSubnetworks
} from '../util/gcp';
import type { getGKEVersionsResponse, getGKEClustersResponse, getGKESubnetworksResponse, getGKESharedSubnetworksResponse } from '../types/gcp.d.ts';
import { debounce } from 'lodash';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { getGKENetworksResponse, GKESubnetwork } from '../types/gcp';

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
    clusterName: {
      type:    String,
      default: ''
    },
    kubernetesVersion: {
      type:    String,
      default: ''
    },
    network: {
      type:    String,
      default: ''
    },
    subnetwork: {
      type:    String,
      default: ''
    },
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
      versionsResponse:          {} as getGKEVersionsResponse,
      /**
       * these are NOT cluster objects in the Rancher cluster (management.cattle.io.cluster provisioning.cattle.io.cluster etc)
       * this is a list of clusters in the user's GCP project, which, on edit, will include the current cluster
       * on edit, this gcp representation of the cluster is checked for a release channel to determine which k8s versions to offer
       */
      clustersResponse:          {} as getGKEClustersResponse,
      networksResponse:          {} as getGKENetworksResponse,
      subnetworksResponse:       {} as getGKESubnetworksResponse,
      sharedSubnetworksResponse: {} as getGKESharedSubnetworksResponse
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
    },
    networkOptions(neu) {
      if (neu && neu.length && !this.network) {
        const firstnetwork = neu.find((network) => network.kind !== 'group');

        this.$emit('update:network', firstnetwork?.name);
      }
    },

    subnetworkOptions(neu) {
      if (neu && neu.length) {
        const firstSubnet = neu[0];

        if (firstSubnet?.name) {
          this.$emit('update:subnetwork', firstSubnet.name);
        }
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
      this.getSharedSubnetworks();
      // gcp clusters are fetched on edit to check this cluster's release channel & offer appropriate k8s versions
      if (this.mode !== _CREATE) {
        this.getClusters();
      }
    },

    getVersions() {
      getGKEVersions(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }).then((res) => {
        this.versionsResponse = res;
      }).catch((err) => {
        this.$emit('error', err);
      });
    },

    getNetworks() {
      getGKENetworks(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }).then((res) => {
        this.networksResponse = res;
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
        this.subnetworksResponse = res;
      }).catch((err) => {
        this.$emit('error', err);
      });
    },

    getSharedSubnetworks() {
      return getGKESharedSubnetworks(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }).then((res) => {
        this.sharedSubnetworksResponse = res;
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

    isCreate(): boolean {
      return this.mode === _CREATE;
    },

    releaseChannel(): string | undefined {
      const cluster = (this.clustersResponse?.clusters || []).find((c) => c.name === this.clusterName);

      return cluster?.releaseChannel?.channel;
    },

    // TODO nb filter based off network selection
    subnetworks() {
      return this.subnetworksResponse.items || [];
    },

    sharedNetworks(): {[key: string]: GKESubnetwork[]} {
      const allSharedSubnetworks = this.sharedSubnetworksResponse?.subnetworks || [];
      const networks = {} as any;

      allSharedSubnetworks.forEach((s) => {
        const network = (s.network).split('/').pop() || s.network;

        if (network && !networks[network]) {
          networks[network] = [];
        }
        networks[network].push(s);
      });

      return networks;
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

    networkOptions() {
      const out = [];
      const unshared = (this.networksResponse?.items || []).map((n) => {
        const subnetworksAvailable = this.subnetworks.find((s) => s.network === n.selfLink);

        return { ...n, label: subnetworksAvailable ? `${ n.name } (${ this.t('gke.network.subnetworksAvailable') })` : n.name };
      });
      const shared = (Object.keys(this.sharedNetworks) || []).map((n) => {
        const firstSubnet = this.sharedNetworks[n][0];
        // const displayName = n.split('/').pop();

        return {
          name: n, label: `${ n } (${ this.t('gke.network.subnetworksAvailable') })`, ...firstSubnet
        };
      });

      if (shared.length) {
        out.push({
          label:    this.t('gke.network.sharedvpc'),
          kind:     'group',
          disabled: true,
          name:     'shared'
        }, ...shared);
      } if (unshared.length) {
        out.push({
          label:    this.t('gke.network.vpc'),
          kind:     'group',
          disabled: true,
          name:     'unshared'
        }, ...unshared);
      }

      return out;
    },

    subnetworkOptions(): {label: string, name: string, [key: string]: any}[] {
      const out = [] as any;
      const isShared = !!this.sharedNetworks[this.network];

      if (isShared) {
        out.push(...this.sharedNetworks[this.network]);
      } else {
        out.push(...(this.subnetworks.filter((s) => s.network.split('/').pop() === this.network) || []));
      }

      const labeled = out.map((sn) => {
        const name = sn.name ? sn.name : (sn.subnetwork || '').split('/').pop();

        return {
          name, label: `${ name } (${ sn.ipCidrRange })`, ...sn
        };
      });

      labeled.unshift({ label: this.t('gke.subnetwork.auto'), name: '' });

      return labeled;
    },

    /**
     * Only the user-defined network and subnetwork names appear in the GKE config
     * selectedNetwork and selectedSubnetwork keep track of all the additional networking info from gcp api calls
     * eg subnets' ipCidrRange, to display alongside name in the dropdown
     */
    // TODO nb if nothing in networkOptions matches network, error
    selectedNetwork: {
      get() {
        const { network } = this;

        if (!network) {
          return null;
        }

        return this.networkOptions.find((n) => n.name === network);
      },
      set(neu:{name:string}) {
        this.$emit('update:network', neu.name);
      }
    },

    selectedSubnetwork: {
      get() {
        const { subnetwork } = this;

        if (!subnetwork) {
          return '';
        }

        return this.subnetworkOptions.find((n) => n.name === subnetwork);
      },
      set(neu:{name:string}) {
        this.$emit('update:subnetwork', neu.name);
      }
    }
  }

});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          :options="versionOptions"
          label-key="gke.version.label"
          :value="kubernetesVersion"
          :tooltip="isCreate? '' :t('gke.version.tooltip')"
          @selecting="$emit('update:kubernetesVersion', $event.value)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-model="selectedNetwork"
          :options="networkOptions"
          :mode="mode"
          label-key="gke.network.label"
          option-key="name"
          option-label="label"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="selectedSubnetwork"
          :options="subnetworkOptions"
          option-key="name"
          option-label="label"
          :mode="mode"
          label-key="gke.subnetwork.label"
        />
      </div>
    </div>
  </div>
</template>
