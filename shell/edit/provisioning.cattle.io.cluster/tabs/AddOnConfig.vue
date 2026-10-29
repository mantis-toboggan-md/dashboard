<script>
import { Banner } from '@components/Banner';

import Questions from '@shell/components/Questions';
import YamlEditor from '@shell/components/YamlEditor';
import { _EDIT } from '@shell/config/query-params';
import { RcContentGroup } from '@components/Layout';

export default {
  emits: ['additional-manifest-changed', 'update-questions', 'update-values', 'validationChanged'],

  components: {
    Banner,
    Questions,
    YamlEditor,
    RcContentGroup
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    versionInfo: {
      type:     Object,
      required: true,
    },

    addonVersion: {
      type:     Object,
      required: false,
      default:  null
    },

    addonsRev: {
      type:     Number,
      required: true,
    },
    userChartValuesTemp: {
      type:     Object,
      required: true,
    },
    initYamlEditor: {
      type:     Function,
      required: true,
    },
    /**
     * Indicates if a configuration conflict was detected for this addon.
     */
    hasDiff: {
      type:    Boolean,
      default: false
    },
    /**
     * The Kubernetes version the user is upgrading from.
     */
    previousKubeVersion: {
      type:    String,
      default: ''
    },
    /**
     * The Kubernetes version the user is upgrading to.
     */
    newKubeVersion: {
      type:    String,
      default: ''
    }

  },

  computed: {
    isEdit() {
      return this.mode === _EDIT;
    }
  },

  methods: {
    handleValidationChanged(e) {
      this.$emit('validationChanged', e);
    }
  },
};
</script>

<template>
  <RcContentGroup>
    <Banner
      v-if="isEdit && hasDiff"
      color="warning"
      class="m-0"
    >
      <span
        v-clean-html="t('cluster.addOns.dependencyBanner', {
          previousKubeVersion,
          newKubeVersion
        }, true)"
      />
    </Banner>
    <div
      v-if="versionInfo && addonVersion"
      :key="addonsRev"
    >
      <Questions
        v-if="versionInfo[addonVersion.name] && versionInfo[addonVersion.name].questions && addonVersion.name && userChartValuesTemp[addonVersion.name]"
        v-model:value="userChartValuesTemp[addonVersion.name]"
        :emit="true"
        in-store="management"
        :mode="mode"
        :tabbed="false"
        :source="versionInfo[addonVersion.name]"
        :target-namespace="value.metadata.namespace"
        @updated="$emit('update-questions', addonVersion.name)"
      />
      <YamlEditor
        v-else
        ref="yaml-values"
        data-testid="addon-yaml-editor"
        :value="initYamlEditor(addonVersion.name)"
        :mode="mode"
        :scrolling="true"
        :as-object="true"
        :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
        :hide-preview-buttons="true"
        @update:value="$emit('update-values', addonVersion.name, $event)"
        @validationChanged="handleValidationChanged"
      />
    </div>
  </RcContentGroup>
</template>
