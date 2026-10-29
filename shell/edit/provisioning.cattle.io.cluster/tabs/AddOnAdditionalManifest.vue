<script>
import YamlEditor from '@shell/components/YamlEditor';
import { RcContentGroup } from '@components/Layout';

export default {
  components: { YamlEditor, RcContentGroup },

  emits: ['additional-manifest-changed'],

  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    }
  },

  computed: {
    additionalManifest: {
      get() {
        return this.value.spec.rkeConfig.additionalManifest;
      },
      set(neu) {
        this.$emit('additional-manifest-changed', neu);
      }
    },

    distro() {
      return this.value.isK3s ? 'k3s' : 'rke2';
    }
  }
};
</script>

<template>
  <RcContentGroup>
    <t
      k="cluster.addOns.additionalManifest.description"
      :distro="distro"
      raw
      class="text-deemphasized"
    />
    <YamlEditor
      ref="yaml-additional"
      v-model:value="additionalManifest"
      :mode="mode"
      :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
      initial-yaml-values="# Additional Manifest YAML"
      class="yaml-editor"
    />
  </RcContentGroup>
</template>
