<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import Labels from '@shell/edit/provisioning.cattle.io.cluster/Labels';
import { Banner } from '@components/Banner';
import { saferDump } from '@shell/utils/create-yaml';

import CreateEditView from '@shell/mixins/create-edit-view';

import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor';
import { CAPI } from '@shell/config/types';
import { K3K } from '../types';

const defaultCluster = {
  apiVersion: 'k3k.io/v1alpha1',
  kind:       'Cluster',
  metadata:   { name: '' },
  spec:       {
    agents:      0,
    expose:      { nodePort: { enabled: true } },
    persistence: { storageRequestSize: '1G', type: 'ephermal' },
    servers:     1,
    tlsSANs:     ['127.0.0.1'],
    token:       '',
    version:     'v1.26.1-k3s1'
  }
};

export default {
  emites: ['update:value'],

  components: {
    LabeledSelect,
    NameNsDescription,
    Tabbed,
    Tab,
    CruResource,
    Loading,
    Labels,
    ClusterMembershipEditor,
    Banner
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    provider: {
      type:     String,
      required: true,
    },
  },

  name: 'CruK3KCluster',

  async fetch() {
    if ( this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER) ) {
      this.provClusters = await this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });
    }

    this.k3kCluster = await this.$store.dispatch('management/create', {
      type: K3K.CLUSTER,
      ...defaultCluster
    });
  },

  created() {
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  data() {
    return {
      provClusters: [], parentCluster: '', k3kCluster: {}
    };
  },

  watch: {
    parentClusterOptions(neu) {
      if (!this.parentCluster && neu.length) {
        this.parentCluster = neu[0].value;
      }
    },
  },

  computed: {
    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    },

    // TODO nb filter virtual clusters
    parentClusterOptions() {
      return this.provClusters.reduce((opts, cluster) => {
        if (!cluster?.metadata?.annotations?.['ui.rancher/parent-cluster']) {
          opts.push({ label: cluster.name, value: cluster.id });
        }

        return opts;
      }, []);
    },
    localValue: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('update:value', newValue);
      }
    }

  },

  methods: {
    onMembershipUpdate(update) {
      this['membershipUpdate'] = update;
    },

    async saveRoleBindings() {
      await this.value.waitForMgmt();

      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.value.mgmt.id);
      }
    },

    updateName({ name }) {
      this.k3kCluster.metadata.name = name;
    },

    // create the k3k cluster crd
    async createCluster() {
      const cluster = this.provClusters.find((c) => c.id === this.parentCluster);

      const normanCluster = await cluster.findNormanCluster();

      delete this.k3kCluster.type;
      const apply = saferDump(this.k3kCluster);

      await normanCluster.doAction('importYaml', { yaml: apply });

      return normanCluster.id;
    },

    // create the prov cluster crd, get import command
    async saveOverride(btnCb) {
      const clusterId = await this.createCluster();

      // Create the imported cluster

      // Add annotations
      this.value.metadata = this.value.metadata || {};
      // TODO nb annotations?
      this.value.metadata.annotations = this.value.metadata.annotations || {};
      this.value.metadata.annotations['ui.rancher/provider'] = 'k3k';
      this.value.metadata.annotations['ui.rancher/parent-cluster'] = clusterId;
      this.value.metadata.annotations['ui.rancher/k3k-namespace'] = this.value.metadata.name;

      await this.save(btnCb);

      const clusterToken = await this.value.getOrCreateToken();

      while (!clusterToken.command) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      const command = clusterToken.command.split(' ');
      const registrationUrl = command[command.length - 1];

      console.log('command, url: ', command, registrationUrl);
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :mode="mode"
    :resource="value"
    :errors="errors"
    component-testid="cluster-manager-virtual-cluster"
    @finish="saveOverride"
    @error="e=>errors = e"
  >
    <NameNsDescription
      v-if="!isView"
      v-model:value="localValue"
      :mode="mode"
      :namespaced="false"
      name-label="cluster.name.label"
      name-placeholder="cluster.name.placeholder"
      description-label="cluster.description.label"
      description-placeholder="cluster.description.placeholder"
      @update:value="updateName"
    />

    <Tabbed
      :side-tabs="true"
      default-tab="virtual-cluster"
    >
      <Tab
        name="virtual-cluster"
        label="Cluster"
        :weight="5"
      >
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="parentCluster"
              label="Parent Cluster"
              :options="parentClusterOptions"
            />
          </div>
        </div>
        <div class="row mt-20">
          <div class="col span-6">
            <!-- <LabeledSelect
              :value.sync="k8sVersion"
              :label="t('vcluster.fields.k8sVersion')"
              :localized-label="true"
              :mode="mode"
              :options="k8sVersions"
            /> -->
          </div>
        </div>
      </Tab>
      <Tab
        v-if="canManageMembers"
        name="memberRoles"
        label-key="cluster.tabs.memberRoles"
        :weight="3"
      >
        <Banner
          v-if="isEdit"
          color="info"
        >
          {{ t('cluster.memberRoles.removeMessage') }}
        </Banner>
        <ClusterMembershipEditor
          :mode="mode"
          :parent-id="value.mgmt ? value.mgmt.id : null"
          @membership-update="onMembershipUpdate"
        />
      </Tab>
      <Labels
        v-model:value="localValue"
        :mode="mode"
      />
    </Tabbed>
  </CruResource>
</template>
