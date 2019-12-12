
<script>
import { mapActions, mapMutations, mapGetters } from 'vuex';
import { RIO } from '../../config/types';
import { get, cleanUp } from '@/utils/object';
import { randomStr } from '@/utils/string';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Rule from '@/edit/rio.cattle.io.v1.router/Rule';
import Footer from '@/components/form/Footer';

export default {
  name:       'CruRouter',
  components: {
    Rule,
    NameNsDescription,
    Footer
  },
  mixins:     [CreateEditView],

  inject:   { disableInputs: { default: false } },
  computed: {
    metadata: {
      get() {
        return { metadata: this.$store.getters[`friendly/${ RIO.ROUTER }/metadata`] };
      },
      set(neu) {
        this.updateMetadata(neu);
      }
    },
    routes() {
      return this.$store.state.friendly[RIO.ROUTER].routes;
    },
    ...mapGetters(`friendly/${ RIO.ROUTER }`, ['toSave'])

  },
  methods:  {
    async saveRouter(buttonCB) {
      this.value = await this.$store.dispatch('cluster/create', this.toSave);
      debugger;
      this.save(buttonCB);
    },
    ...mapMutations(`friendly/${ RIO.ROUTER }`, ['addRule', 'updateMetadata']),
  }
};
</script>

<template>
  <form>
    <div v-if="metadata" class="row">
      <NameNsDescription v-model="metadata" class="col span-12" :mode="mode" :register-before-hook="registerBeforeHook" @input="updateMetadata" />
    </div>
    <h2>Rules</h2>
    <div class="row">
      <div class="col span-12">
        <Rule
          v-for="(route, i) in routes"
          :id="route"
          :key="route"
          :position="i"
          class="col span-12"
        />
      </div>
    </div>
    <button :disabled="disableInputs" type="button" class="btn role-tertiary add" @click="addRule">
      <i class="icon icon-plus" />
      Add Rule
    </button>
    <Footer :mode="mode" :errors="errors" @save="saveRouter" @done="done" />
  </form>
</template>

<style>
  .footer-controls {
    justify-content: center;
    margin-right: 20px;
  }
  .returned-errors{
    color: red;
  }
</style>
