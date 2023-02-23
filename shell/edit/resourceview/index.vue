<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import { LabeledInput } from '@components/Form/LabeledInput';
import TablePreview from './TablePreview';
import { MANAGEMENT, CUSTOM_RESOURCE_DEFINITION, SCHEMA } from '@shell/config/types';
import { fetchOrCreateSetting } from '@shell/utils/settings';
import { mapGetters } from 'vuex';

/*
A resourceview is a spoofed type saved in a global setting 'resourceviews'
'value' here is one element from the setting's data
{
  id: crd id
  columns: []{label, path}
}

*/
export default {
  name:       'CRUCustomView',
  mixins:     [CreateEditView],
  components: {
    CruResource,
    LabeledSelect,
    ToggleSwitch,
    LabeledInput,
    TablePreview
  },

  async fetch() {
    this.allClusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
    // TODO nb use constant for id
    fetchOrCreateSetting(this.$store, 'resourceviews', '').then((viewSetting) => {
      this.parsedSetting = JSON.parse(viewSetting?.value || '{}');
      this.viewSetting = viewSetting;
      if (this.value?.resource) {
        // 'views' are identified by crd id, which can change in this form: delete the 'view' being 'edited' then re-add when saving
        delete this.parsedSetting[this.value?.resource];
      }
    }).catch((e) => {
      console.error(e);
    });
  },

  data() {
    return {
      // global setting in which this value is stored
      viewSetting:         null,
      allClusters:         [],
      cluster:             null,
      // all customresourcedefinition objects, fetched when a cluster is selected
      crds:                [],
      schemas:             [],
      hideSystemResources: false,
      // targetCrd:           this.value?.id,
      targetSchema:        this.value?.id,
      targetPath:          null,
      targetLabel:         null,
      columns:             this.value?.columns || [],
      // loadingCrds:         false,
      loadingSchemas:      false,
    };
  },

  methods: {
    save(btnCB) {
      // this.$set(this.parsedSetting, this.targetCrd, { id: this.targetCrd, columns: this.columns });
      this.$set(this.parsedSetting, this.targetSchema.id, { id: this.targetSchema.id, columns: this.columns });

      try {
        this.viewSetting.value = JSON.stringify(this.parsedSetting);
      } catch (e) {
        console.error(e);
      }
      this.viewSetting.save().then(() => {
        btnCB(true);
        this.done();
      }).catch((e) => {
        this.errors.push(e);
        btnCB(false);
      });
    },

    addColumn() {
      this.columns.push({
        // TODO nb properly cleaned name?
        label: this.targetLabel, value: this.targetPath, name: this.targetLabel.replace(/ |\./g, '').toLowerCase()
      });
      this.targetLabel = null;
      this.targetPath = null;
    },

    // fetchCrds() {
    //   this.loadingCrds = true;
    //   const url = `/k8s/clusters/${ this.cluster }/v1/${ CUSTOM_RESOURCE_DEFINITION }s`;

    //   this.$store.dispatch('management/request', { opt: { url } }).then((res) => {
    //     const { data = [] } = res;

    //     this.crds = data;
    //     this.loadingCrds = false;
    //   }).catch((err) => {
    //     // TODO nb what to do with cluster loading error?
    //     console.error(err);
    //   });
    // },

    fetchSchemas() {
      this.loadingSchemas = true;
      const url = `/k8s/clusters/${ this.cluster }/v1/${ SCHEMA }s`;

      this.$store.dispatch('management/request', { opt: { url } }).then((res) => {
        const { data = [] } = res;

        this.schemas = data;
        this.loadingSchemas = false;
      }).catch((err) => {
        // TODO nb what to do with cluster loading error?
        console.error(err);
      });
    },

    // isSystemCrd(crd) {
    //   // TODO nb use constant, also is this only management group?
    //   return crd.group === 'management.cattle.io';
    // },

    // Just going to assume that all resources have metadata - any schema without must be defining something within a resource
    isRootSchema(schema) {
      return schema.resourceFields.metadata;
    },

    // TODO nb what schemas should be hidden?
    isSystemSchema(schema) {
      return false;
    },

    // TODO nb filter out resources with entirely custom list views, eg namespaces
    hasCustomListView(schema) {
      return false;
    },

    hideSchema(schema) {
      return !this.isRootSchema(schema) && !this.hasCustomListView(schema) && (!this.isSystemSchema(schema) || !this.hideSystemResources);
    }
  },

  watch: {
    cluster(neu) {
      if (neu) {
        // this.fetchCrds();
        this.fetchSchemas();
      }
    }
  },

  computed: {
    ...mapGetters({ headersFor: 'type-map/headersFor' }),
    // parsedSetting: {
    //   get() {
    //     try {
    //       const parsed = JSON.parse(this.viewSetting?.value || '[]');

    //       return parsed;
    //     } catch (e) {
    //       // TODO nb how would this happen? Do we need to care?
    //       // eslint-disable-next-line no-console
    //       console.error(e);
    //     }

    //     return [];
    //   },
    //   set(neu) {
    //     debugger;
    //     try {
    //       const strung = JSON.stringify(neu);

    //       this.$set(this.viewSetting, 'value', strung);
    //     } catch (e) {
    //       // TODO nb better error handling
    //       this.errors.push(e);
    //     }
    //   }
    // },

    // columns: {
    //   get() {
    //     if (this.targetCrd) {
    //       return this.parsedSetting[this.targetCrd] || [];
    //     }

    //     return [];
    //   },
    //   set(neu) {
    //     this.$set(this.parsedSetting, this.targetCrd, neu);
    //   }

    // },

    // crdOpts() {
    //   return this.crds.reduce((opts, crd) => {
    //     if (!this.isSystemCrd(crd)) {
    //       opts.push({ label: crd.spec.names.plural || crd.id, value: crd });
    //     }

    //     return opts;
    //   }, []);
    // },

    schemaOpts() {
      return this.schemas.reduce((opts, schema) => {
        if (!this.hideSchema(schema)) {
          opts.push({ label: schema.id, value: schema });
        }

        return opts;
      }, []);
    },

    clusterOpts() {
      return this.allClusters.map((c) => {
        return {
          label: c.nameDisplay,
          value: c.id
        };
      });
    },

    headersFromSchema() {
      return this.targetSchema ? this.headersFor(this.targetSchema) : [];
    }

  }
};
</script>

<template>
  <div>
    {{ {...value} }}

    <CruResource
      :resource="value"
      :mode="mode"
      done-route="c-cluster-product-resource"
      @finish="save"
      @error="e=>errors = e"
    >
      <div class="row mb-10">
        <span>
          <!-- TODO nb translation -->
          To define which fields to display for a given resource type, first select a cluster and the type of resource you would like to customize, then select a field from that resource and click 'Add'. <br>
          This configuration will be used for ALL clusters with this type of resource definition.
        </span>
      </div>

      <div class="row mb-10" />

      <div class="row mb-10">
        <div class="col span-5">
          <!-- TODO nb translation -->
          <LabeledSelect
            v-model="cluster"
            :options="clusterOpts"
            :mode="mode"
            label="Cluster"
            taggable
            searchable
          />
        </div>
        <div class="col span-5">
          <!-- TODO nb translation
          <LabeledSelect
            v-model="targetCrd"
            :options="crdOpts"
            :mode="mode"
            label="Custom Resource Definition"
            :loading="loadingCrds"
            taggable
            searchable
          /> -->
          <!-- TODO nb translation -->
          <LabeledSelect
            v-model="targetSchema"
            :options="schemaOpts"
            :mode="mode"
            label="Resource Type"
            :loading="loadingSchemas"
            taggable
            searchable
          />
        </div>
        <div class="col span-2">
          <!-- TODO nb translation  -->
          <ToggleSwitch
            v-model="hideSystemResources"
            on-label="Hide System Resources"
          />
        </div>
      </div>

      <template v-if="targetSchema">
        <div
          v-for="col in headersFromSchema"
          :key="col.name"
        >
          <ul>
            <li
              v-for="(val, key) in col"
              :key="key"
            >
              {{ key }}:{{ val }}
            </li>
          </ul>
        </div>
        <div
          class="row mb-10"
        >
          <div class="col span-5">
            <LabeledInput
              v-model="targetPath"
              :mode="mode"
              label="Path to Display Value"
              placeholder="e.g. metadata.namespace"
              tooltip="The path can be any valid JSONPath, e.g. '$['spec']['rules'][0].host'"
            />
          </div>
          <div class="col span-5">
            <LabeledInput
              v-model="targetLabel"
              :mode="mode"
              label="Column Label"
              placeholder="e.g. Namespace"
            />
          </div>
          <div class="col span-2">
            <button
              type="button"
              class="btn role-primary"
              :disabled="!targetPath || !targetLabel"
              @click="addColumn"
            >
              <!-- TODO nb translation -->
              Add Column
            </button>
          </div>
        </div>

        <div class="row mb-10">
          <TablePreview :columns="columns" />
        </div>
      </template>
    </CruResource>
  </div>
</template>
