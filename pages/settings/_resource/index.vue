<script>
import ResourceTable from '@/components/ResourceTable';
import { get } from '@/utils/object';
import { FRIENDLY } from '@/config/friendly';
export default {
  components: { ResourceTable },
  computed:   {
    schema() {
      return this.$store.getters['cluster/schemaFor'](FRIENDLY[this.resource].type);
    },
    headers() {
      return get(FRIENDLY[this.resource], 'headers');
    },
  },
  asyncData(ctx) {
    const resource = ctx.params.resource;

    return ctx.store.dispatch('rancher/findAll', {
      type: resource,
      opt:  { url: `/v3/${ resource }` }
    }, { root: true }).then((rows) => {
      return {
        resource,
        rows
      };
    });
  },
};
</script>

<template>
  <!-- <div>something</div> -->
  <ResourceTable :headers="headers" :schema="schema" :rows="rows" />
</template>
