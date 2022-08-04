<script>
import ResourceTable from '@shell/components/ResourceTable';
export default {
  name: 'ListPciDevices',

  components: { ResourceTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },

  },
  // TODO when we have actual claims load them upfront to make sure async status getter reports correctly
  //   async fetch() {
  //     await this.$store.dispatch('harvester/findAll', { type: HCI.PCI_CLAIM });
  //   },

  methods: {
    enableGroup(rows = []) {
      rows.forEach((row) => {
        if (!row.passthroughClaim) {
          row.enablePassthrough();
        }
      });
    },
    disableGroup(rows = []) {
      rows.forEach((row) => {
        if (row.passthroughClaim) {
          row.disablePassthrough();
        }
      });
    },
    groupIsAllEnabled(rows = []) {
      return !rows.find(device => !device.passthroughClaim);
    }
  }
};
</script>

<template>
  <ResourceTable :schema="schema" :rows="rows">
    <template #group-by="{group}">
      <div :ref="group.key" v-trim-whitespace class="group-tab">
        <button v-if="groupIsAllEnabled(group.rows)" type="button" class="btn btn-sm role-secondary mr-5" @click="e=>{disableGroup(group.rows); e.target.blur()}">
          {{ t('harvester.pci.disableGroup') }}
        </button>
        <button v-else type="button" class="btn btn-sm role-secondary mr-5" @click="e=>{enableGroup(group.rows); e.target.blur()}">
          {{ t('harvester.pci.enableGroup') }}
        </button>
        <span v-html="group.key" />
      </div>
    </template>
    <template #cell:claimed="{row}">
      <span v-if="row.isEnabled">{{ row.claimedBy }}</span>
      <span v-else class="text-muted">&mdash;</span>
    </template>
  </ResourceTable>
</template>
