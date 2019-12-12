<script>
import { mapGetters, mapState } from 'vuex';
import { TO_FRIENDLY } from '../config/friendly';
import ResourceYaml from '@/components/ResourceYaml';

export default {
  components: { ResourceYaml },
  props:      {
    type: {
      type:    String,
      default: ''
    }
  },
  provide() {
    return { disableInputs: this.$store.getters[`friendly/isView`] };
  },
  computed: {
    realMode() {
      return this.$store.state.friendly.realMode;
    },
    parentLink() {
      const doneRoute = this.$store.getters[`friendly/doneRoute`];
      const doneParams = this.$store.getters[`friendly/doneParams`];

      return this.$router.resolve({ doneRoute, doneParams }).href;
    },
    typeDisplay() {
      return TO_FRIENDLY[this.type].singular;
    },
    cruComponent() {
      const { type } = this;

      if (this.$store.getters[`friendly/isView`] && TO_FRIENDLY[this.type].hasDetail ) {
        return () => import(`@/detail/${ type }`);
      }

      return () => import(`@/edit/${ type }`);
    },
    ...mapGetters('friendly', ['originalName', 'fqid', 'namespaceSuffixOnCreate']),
    ...mapState('friendly', ['resourceInstance', 'asYaml', 'yaml', 'mode'])
  },
  watch: {
    resourceInstance() {
      this.$store.dispatch(`friendly/${ this.type }/populateResourceFields`);
    }
  },
  mounted() {
    this.$store.dispatch(`friendly/${ this.type }/populateResourceFields`);
    if (this.asYaml) {
      this.$store.dispatch('friendly/getYaml' );
    }
  },
  destroyed() {
    this.$store.commit(`friendly/cleanState`);
    this.$store.commit(`friendly/${ this.type }/cleanState`);
  },
  methods: {
    async showActions() {
      const resource = await this.resource();

      this.$store.commit('actionMenu/show', {
        resources: resource,
        elem:      this.$refs.actions,
      });
    },
    resource() {
      return this.$store.dispatch('cluster/find', { type: this.type, id: this.fqid });
    }
  }
};
</script>

<template>
  <div>
    <header>
      <h1 v-trim-whitespace>
        <span v-if="realMode === 'edit'">Edit {{ typeDisplay }}:&nbsp;</span>
        <span v-else-if="realMode === 'stage'">Stage from {{ typeDisplay }}:&nbsp;</span>
        <span v-else-if="realMode === 'clone'">Clone from {{ typeDisplay }}:&nbsp;</span>

        <nuxt-link v-else v-trim-whitespace :to="parentLink">
          {{ typeDisplay }}
          :&nbsp;
        </nuxt-link>
        {{ originalName }}
      </h1>
      <div v-if="realMode==='view'" class="actions">
        <button ref="actions" type="button" class="btn btn-sm role-multi-action actions" @click="showActions">
          <i class="icon icon-actions" />
        </button>
      </div>
    </header>
    <template v-if="asYaml">
      <ResourceYaml
        v-if="yaml"
        :obj="resourceInstance"
        :value="yaml"
        :done-route="doneRoute"
        :parent-route="doneRoute"
        :parent-params="doneParams"
      />
    </template>
    <component :is="cruComponent" v-else-if="type" :mode="mode" :namespace-suffix-on-create="namespaceSuffixOnCreate" />
  </div>
</template>
