<script>
import ResourceTable from '@shell/components/ResourceTable';
export default {

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
  methods: {
    enableGroup(rows = []) {
      rows.forEach((row) => {
        if (!row.passthroughClaim) {
          row.enablePassthrough();
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
        <button :disabled="groupIsAllEnabled(group.rows)" type="button" class="btn btn-sm role-secondary mr-5" @click="e=>{enableGroup(group.rows); e.target.blur()}">
          Enable Group
        </button>
        <span v-html="group.key" />
      </div>
    </template>
  </ResourceTable>
</template>
