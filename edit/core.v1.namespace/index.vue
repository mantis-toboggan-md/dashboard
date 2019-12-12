<script>
import { mapState, mapMutations, mapGetters } from 'vuex';
import { get } from '@/utils/object';
import createEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import ResourceQuota from '@/edit/core.v1.namespace/ResourceQuota';
import Footer from '@/components/form/Footer';
import KeyValue from '@/components/form/KeyValue';
import { NAMESPACE } from '@/config/types';

export default {
  components: {
    LabeledInput,
    ResourceQuota,
    Footer,
    KeyValue
  },
  mixins:     [createEditView],
  computed: {
    namespace() {
      return NAMESPACE;
    },
    selfLink() {
      return get(this.value, 'metadata.selfLink');
    },
    ...mapState(`friendly/${ NAMESPACE }`, ['name', 'description', 'annotations', 'labels']),
    ...mapState('friendly', ['type']),
    ...mapGetters(`friendly/${ NAMESPACE }`, ['formatted', 'quotaToUpdate']),
  },
  destroyed() {
    this.$store.commit(`friendly/${ NAMESPACE }/cleanState`);
  },
  methods:  {
    async saveNamespace(buttonCB) {
      this.value = await this.$store.dispatch('cluster/create', this.formatted);
      this.save(buttonCB);
    },
    ...mapMutations(`friendly/${ NAMESPACE }`, ['update'])
  }
};
</script>

<template>
  <div>
    <form>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            :value="name"
            required
            label="Name"
            type="text"
            :mode="mode"
            @input="e=>update({name:e})"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            :value="description"
            :mode="mode"
            label="Description"
            type="text"
            placeholder="Any text you want that better describes the namespace"
            @input="e=>update({description:e})"
          />
        </div>
      </div>
      <h4 class="mb-10">
        Container Default Resource Limit
      </h4>
      <div class="row">
        <ResourceQuota
          class="col span-12"
          :register-after-hook="registerAfterHook"
          :save-u-r-l="selfLink"
          :mode="mode"
          :vuex-module="namespace"
        />
      </div>
      <h4 class="mb-10">
        Labels and Annotations
      </h4>
      <div class="row">
        <div class="col span-6">
          <KeyValue
            key="labels"
            :value="labels"
            :mode="mode"
            :value-multiline="false"
            :pad-left="false"
            :read-allowed="false"
            add-label="Add Label"
            :protip="false"
            @input="e=>update({labels:e})"
          />
        </div>
        <div class="col span-6">
          <KeyValue
            key="annotations"
            :value="annotations"
            :value-multiline="false"
            :mode="mode"
            :pad-left="false"
            :read-allowed="false"
            add-label="Add Annotation"
            :protip="false"
            @input="e=>update({annotations:e})"
          />
        </div>
      </div>

      <Footer :mode="mode" :errors="errors" @save="saveNamespace" @done="done" />
    </form>
  </div>
</template>
