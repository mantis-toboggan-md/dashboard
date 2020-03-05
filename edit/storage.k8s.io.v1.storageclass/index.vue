<script>
import CreateEditView from '@/mixins/create-edit-view';
import { SC_PROVISIONER, SECRET, CSI_DRIVER } from '@/config/types';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Parameters from '@/edit/storage.k8s.io.v1.storageclass/Parameters';
import LoadDeps from '@/mixins/load-deps';
import Customize from '@/edit/storage.k8s.io.v1.storageclass/Customize';
import Footer from '@/components/form/Footer';
import { allHash } from '@/utils/promise';

export default {
  name:       'CRUStorageClass',
  components: {
    NameNsDescription,
    LabeledSelect,
    Tabbed,
    Tab,
    Parameters,
    Customize,
    Footer
  },
  mixins: [LoadDeps, CreateEditView],
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
    return {
      provisioner: this.value?.provisioner,
      allSecrets:  [],
      spec:        { ...this.value },
      csiDrivers:  []
    };
  },

  computed: {
    provisioners() {
      return Object.keys(SC_PROVISIONER).map((key) => {
        return { label: key, value: SC_PROVISIONER[key] };
      });
    }
  },

  watch: {
    // each provisioner has different fields within parameters; delete previous when provisioner changes
    provisioner() {
      delete this.spec.parameters;
    }
  },

  methods: {
    async loadDeps() {
      const hash = await allHash({
        secrets:    this.$store.dispatch('cluster/findAll', { type: SECRET }),
        csiDrivers: this.$store.dispatch('cluster/findAll', { type: CSI_DRIVER })
      });

      this.allSecrets = hash.secrets;
      this.csiDrivers = hash.csiDrivers.reduce((all, driver) => {
        all.push(driver.metadata.name);

        return all;
      }, []);
    },

    saveSC(cb) {
      this.spec.provisioner = this.provisioner;
      delete this.value.parameters;
      Object.assign(this.value, this.spec);

      const saveUrl = this.value.urlFromAPIVersion;

      this.save(cb, saveUrl);
    }
  }
};
</script>

<template>
  <div>
    <form>
      <NameNsDescription :namespaced="false" :value="spec" :mode="mode" :extra-columns="['type']">
        <template v-slot:type>
          <LabeledSelect v-model="provisioner" label="Provisioner" :options="[...provisioners, ...csiDrivers]" :searchable="false" required />
        </template>
      </NameNsDescription>

      <Tabbed default-tab="parameters">
        <Tab name="parameters" label="Parameters">
          <Parameters v-model="spec" :provisioner="provisioner" :secrets="allSecrets" />
        </Tab>
        <Tab name="customize" label="Customize">
          <Customize v-model="spec" :provisioner="provisioner" />
        </Tab>
      </Tabbed>
      <Footer :mode="mode" @save="saveSC" @done="done" />
    </form>
  </div>
</template>
