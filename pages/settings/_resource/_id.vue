<script>
import { TO_FRIENDLY } from '@/config/friendly';
import CreateEditView from '@/mixins/create-edit-view';
export default {
  mixins:     { CreateEditView },

  computed: {
    // component() {
    //   if ( this.isView && TO_FRIENDLY[this.type].hasDetail ) {
    //     debugger;

    //     return () => import(`@/detail/${ this.type }`);
    //   }
    //   debugger;

    //   return () => import(`@/edit/${ this.type }`);
    // }
  },
  async asyncData(ctx) {
    const { resource, id } = ctx.params;

    const resourceInstance = await ctx.store.dispatch('cluster/find', { type: resource, id });

    return { resourceInstance, type: resource };
  }
};
</script>

<template>
  <div>
    <!-- <component :is="component" /> -->
  </div>
</template>
