<script>
import { _VIEW } from '../../../config/query-params';
import { get } from '../../../utils/object';
import { TO_FRIENDLY, FRIENDLY } from '@/config/friendly';
export default {

  computed: {
    component() {
      if ( this.mode === _VIEW && TO_FRIENDLY[this.type].hasDetail ) {
        return () => import(`@/detail/${ this.type }`);
      }

      return () => import(`@/edit/${ this.type }`);
    },
    nameDisplay() {
      return this.resourceInstance.nameDisplay;
    },
    typeDisplay() {
      return TO_FRIENDLY[this.type].singular;
    },
    parentLink() {
      const name = this.$route.name.replace('-id', '');
      const params = { resource: TO_FRIENDLY[this.type].plural.toLowerCase() };

      return this.$router.resolve({ name, params }).href;
    },
    isView() {
      return this.mode === _VIEW;
    }
  },
  async asyncData(ctx) {
    const { params:{ resource, id }, route:{ query:{ mode = _VIEW } } } = ctx;
    const type = FRIENDLY[resource].type;

    const resourceInstance = await ctx.store.dispatch('cluster/find', { type, id });

    return {
      resourceInstance, type, mode
    };
  }
};
</script>

<template>
  <div>
    <header>
      <h1 v-trim-whitespace>
        <span v-if="mode === 'edit'">Edit {{ typeDisplay }}:&nbsp;</span>
        <span v-else-if="mode === 'stage'">Stage from {{ typeDisplay }}:&nbsp;</span>
        <span v-else-if="mode === 'clone'">Clone from {{ typeDisplay }}:&nbsp;</span>
        <nuxt-link v-else v-trim-whitespace :to="parentLink">
          {{ typeDisplay }}:
        </nuxt-link>&nbsp;{{ nameDisplay }}
      </h1>
      <div v-if="isView" class="actions">
        <button ref="actions" type="button" class="btn btn-sm role-multi-action actions">
          <i class="icon icon-actions" />
        </button>
      </div>
    </header>
    <component :is="component" :value="resourceInstance" />
  </div>
</template>
