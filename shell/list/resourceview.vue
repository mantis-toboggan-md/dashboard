<script>
import { fetchOrCreateSetting } from '@shell/utils/settings';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  name:       'ListResourceViews',
  components: { ResourceTable },
  async fetch() {
    // TODO nb use a constant for the name of this setting
    this.viewSetting = await fetchOrCreateSetting(this.$store, 'resourceviews', '');
    this.viewSchema = await this.$store.getters['management/schemaFor']( 'resourceview' );
    this.getViews();
  },

  data() {
    return {
      viewSetting: null, viewSchema: null, rows: []
    };
  },

  watch: {
    viewSetting() {
      this.getViews();
    }
  },

  methods: {
    getViews() {
      this.$store.dispatch('management/findAll', { type: 'resourceview', opt: { force: true } }).then((views) => {
        this.rows = views;
      });
    }
  },

  computed: {
    // TODO verify can edit global settings
    canCreate() {
      return this.viewSetting && this.viewSetting.canUpdate;
    }
  }
};
</script>

<template>
  <div>
    <div v-if="rows.length">
      {{ rows }}
      <div>
        <ResourceTable
          :rows="rows"
          :schema="viewSchema"
        />
      </div>
    </div>
    <div
      v-else
    >
      <!-- TODO nb translations -->
      There are no Custom Resource Views configured. <br> Customize the table columns displayed in the list view of a given custom resource type by clicking on the Create button at top right.
    </div>
  </div>
</template>
