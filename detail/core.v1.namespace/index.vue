<script>
import { mapState } from 'vuex';
import { NAMESPACE } from '../../config/types';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import KeyValue from '@/components/form/KeyValue';
export default {
  name:       'DetailNamespace',
  components: {
    Tab,
    Tabbed,
    KeyValue
  },
  computed: {
    ...mapState({
      namespace: (state) => {
        return state.friendly[NAMESPACE];
      }
    })
  },

};
</script>

<template>
  <div class="namespace-detail">
    <div class="row mb-20">
      <div class="col span-6">
        <span class="text-muted">
          Description
        </span>
        <div>
          {{ namespace.description }}
        </div>
      </div>
    </div>
    <div class="row">
      <div v-for="type in ['CPU', 'Memory']" :key="type" class="col span-6">
        <h4 class="mb-10">
          {{ type }}
        </h4>
        <div class="row">
          <div class="col span-6">
            <div class="text-muted">
              {{ type }} Limit
            </div>
            <div>
              {{ namespace[`limits${type}`] }}
            </div>
          </div>
          <div class="col span-6">
            <div class="text-muted">
              {{ type }} Request
            </div>
            <div>
              {{ namespace[`reqs${type}`] }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <Tabbed class="col span-12" default-tab="labels">
        <Tab name="labels" label="Labels">
          <KeyValue :protip="false" mode="view" :value="namespace.labels" />
        </Tab>
        <Tab name="annotations" label="Annotations">
          <KeyValue :protip="false" mode="view" :value="namespace.annotations" />
        </Tab>
      </Tabbed>
    </div>
  </div>
</template>
