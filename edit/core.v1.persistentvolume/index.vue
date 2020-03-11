<script>
import volumeSpecs from './volume-specs';
import PluginConfig from './PluginConfig';
import LoadDeps from '@/mixins/load-deps';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
import LabeledSelect from '@/components/form/LabeledSelect';
import UnitInput from '@/components/form/UnitInput';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';

export default {
  name:       'CRUPersistentVolume',

  components: {
    NameNsDescription,
    UnitInput,
    LabeledSelect,
    Tabbed,
    Tab,
    PluginConfig
  },

  mixins:     [LoadDeps, CreateEditView],

  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  data() {
    const { spec = {} } = this.value;

    return { volumeType: '', spec };
  },

  computed: {
    volumeTypes() {
      return Object.keys(volumeSpecs);
    },

    capacity: {
      get() {
        return this.spec?.capacity?.storage.split('Gi')[0];
      },

      set(neu) {
        if (!this.spec.capacity) {
          this.$set(this.spec, 'capacity', { storage: `${ neu }Gi` });
        } else {
          this.$set(this.spec.capacity, 'storage', `${ neu }Gi` );
        }
      }
    }
  }
};
</script>

<template>
  <div>
    <NameNsDescription
      :mode="mode"
      :namespaced="false"
      :value="value"
    />
    <div class="row">
      <LabeledSelect
        v-model="volumeType"
        label="Volume Plugin"
        :options="volumeTypes"
        required
      />
      <UnitInput v-model="capacity" required label="Capacity" suffix="GiB" />
    </div>
    <Tabbed default-tab="config">
      <Tab name="config" label="Plugin Configuration">
        <PluginConfig v-model="spec" :mode="mode" :volume-type="volumeType" />
      </Tab>
      <Tab name="customize" label="Customize">
      </Tab>
    </Tabbed>
  </div>
</template>
