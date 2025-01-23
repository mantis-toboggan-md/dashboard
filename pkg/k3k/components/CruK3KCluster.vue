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
import { base64Decode } from '@shell/utils/crypto';

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
    persistence: {
      storageRequestSize: '1G', type: 'dynamic', storageClassName: 'local-path'
    },
    servers:    1,
    tlsSANs:    ['127.0.0.1'],
    token:      'testtoken',
    version:    'v1.26.1-k3s1',
    serverArgs: ['--write-kubeconfig-mode=0644']
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

    const decodedCertAuthorityData = base64Decode('LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJkakNDQVIyZ0F3SUJBZ0lCQURBS0JnZ3Foa2pPUFFRREFqQWpNU0V3SHdZRFZRUUREQmhyTTNNdGMyVnkKZG1WeUxXTmhRREUzTXpjMU9ERTRNRFV3SGhjTk1qVXdNVEl5TWpFek5qUTFXaGNOTXpVd01USXdNakV6TmpRMQpXakFqTVNFd0h3WURWUVFEREJock0zTXRjMlZ5ZG1WeUxXTmhRREUzTXpjMU9ERTRNRFV3V1RBVEJnY3Foa2pPClBRSUJCZ2dxaGtqT1BRTUJCd05DQUFTR2NJMzNsd2MrMUluV0xkTXNabnp1UFFWMCtCWDNmcnB1aVpwL2ZzeXUKNVk5dHZVQ2FEaUpWcS95NWpwOUFGRnZ5Y2hxREF6Zk93ZHhvV0U4N2FRQ1FvMEl3UURBT0JnTlZIUThCQWY4RQpCQU1DQXFRd0R3WURWUjBUQVFIL0JBVXdBd0VCL3pBZEJnTlZIUTRFRmdRVUtZNkMrVU50aXQ4dk1yWEtIbE52CkkyWUNzVW93Q2dZSUtvWkl6ajBFQXdJRFJ3QXdSQUlnZEE5MDBkZmdQaFdHbFFCcE5JdUN5cDVya3VibkVMOTYKWFNLOEJ2aDJOY0FDSURQZVdtRTF4V2xLL0Q3MHlEaTRWSHI2WGpBUzE0SEZSNVNDWENFcUFXVU0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=');

    console.log('*** decodedCertAuthorityData: ', decodedCertAuthorityData);

    const decodedClientCertData = base64Decode('LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJrVENDQVRlZ0F3SUJBZ0lJR0lmVTFUNGI1b3d3Q2dZSUtvWkl6ajBFQXdJd0l6RWhNQjhHQTFVRUF3d1kKYXpOekxXTnNhV1Z1ZEMxallVQXhOek0zTlRneE9EQTFNQjRYRFRJMU1ERXlNakl4TXpZME5Wb1hEVEkyTURFeQpNakl4TXprd09Gb3dNREVYTUJVR0ExVUVDaE1PYzNsemRHVnRPbTFoYzNSbGNuTXhGVEFUQmdOVkJBTVRESE41CmMzUmxiVHBoWkcxcGJqQlpNQk1HQnlxR1NNNDlBZ0VHQ0NxR1NNNDlBd0VIQTBJQUJBNDBENU51L2lTYXhYeXgKNHZWVXJaMFVOeXhqcGkvNXZ4M2R2czFydG1CRTNwWlFPTmdlVFdoSGw1a1k2UnZTZlVXWHdhbVhwa3p6Z3N0cApEVDFVZm9HalNEQkdNQTRHQTFVZER3RUIvd1FFQXdJRm9EQVRCZ05WSFNVRUREQUtCZ2dyQmdFRkJRY0RBakFmCkJnTlZIU01FR0RBV2dCUUplcWU0MWJZSmhMVjAzQ2lHazNOcU44Q2dSVEFLQmdncWhrak9QUVFEQWdOSUFEQkYKQWlFQTcyN082b1p3SERoNGxtR29kSUtGWFUzUmgxZ0lDNnlZaENDNGZ4YzJNMlFDSUZCUERGWkY5Z3lwYkRtSApPdG5Hc0ROcXAxUlFxR0VibnlpYVl3cGwvd0VUCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJkekNDQVIyZ0F3SUJBZ0lCQURBS0JnZ3Foa2pPUFFRREFqQWpNU0V3SHdZRFZRUUREQmhyTTNNdFkyeHAKWlc1MExXTmhRREUzTXpjMU9ERTRNRFV3SGhjTk1qVXdNVEl5TWpFek5qUTFXaGNOTXpVd01USXdNakV6TmpRMQpXakFqTVNFd0h3WURWUVFEREJock0zTXRZMnhwWlc1MExXTmhRREUzTXpjMU9ERTRNRFV3V1RBVEJnY3Foa2pPClBRSUJCZ2dxaGtqT1BRTUJCd05DQUFUVStTdkxpMlAyR01zenpjejkzcWJ2eC9PMnd5Y0dWdzhvUWtvb3VsM0cKMm5WdWZOcnZWbldkNFJQVVBWcWRRY01EdnVKK0UrSVlFajhmNzBuTjdKYjNvMEl3UURBT0JnTlZIUThCQWY4RQpCQU1DQXFRd0R3WURWUjBUQVFIL0JBVXdBd0VCL3pBZEJnTlZIUTRFRmdRVUNYcW51TlcyQ1lTMWROd29ocE56CmFqZkFvRVV3Q2dZSUtvWkl6ajBFQXdJRFNBQXdSUUloQUx2RlM5S3V0ZnAwU0VKelN6WkpLaGJHSUxvSnFDQVIKdGExWXRlcnNLODN0QWlCOEtrZ1BFU0tPZ0ZrcWJyQ1QyeE9JaldGUktETUx4VkMyd2tuOUFseFJwUT09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K');
    const decodedClientKeyData = base64Decode('LS0tLS1CRUdJTiBFQyBQUklWQVRFIEtFWS0tLS0tCk1IY0NBUUVFSUJwZGkyNzlxSXE3blpoRS9TNlpwMXA2VjhMTHB4SERkRk96WTc4RzNtS2NvQW9HQ0NxR1NNNDkKQXdFSG9VUURRZ0FFRGpRUGsyNytKSnJGZkxIaTlWU3RuUlEzTEdPbUwvbS9IZDIreld1MllFVGVsbEE0MkI1TgphRWVYbVJqcEc5SjlSWmZCcVplbVRQT0N5MmtOUFZSK2dRPT0KLS0tLS1FTkQgRUMgUFJJVkFURSBLRVktLS0tLQo=');

    console.log('*** decodedClientCertData: ', decodedClientCertData);
    console.log('*** decodedClientKeyData: ', decodedClientKeyData);
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

    // TODO nb filter virtual clusters another way?
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

      // const importJobYaml = require('../resources/import-job.yaml.md').body;

      // const url = `/api/v1/namespaces/k3k-${ this.value.metadata.name }/services/https:${ this.value.metadata.name }-k3k--headless:6443/proxy/`;

      // if (!importJobYaml) {
      //   console.error('Could not load import template');

      //   const a = require('../resources/import-job.yaml.md');
      //   console.log(a);
      //   return;
      // }

      // let templateYaml = importJobYaml.replaceAll(/k3knamespace/g, this.value.metadata.name);

      // templateYaml = templateYaml.replaceAll(/__url/g, registrationUrl);

      // const apply = {
      //   defaultNamespace: this.value.metadata.name,
      //   yaml:             templateYaml
      // };

      // await this.$store.dispatch('management/request', {
      //   url:    `/v1/management.cattle.io.clusters/${ clusterId }?action=apply`,
      //   method: 'POST',
      //   data:   apply
      // });
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
