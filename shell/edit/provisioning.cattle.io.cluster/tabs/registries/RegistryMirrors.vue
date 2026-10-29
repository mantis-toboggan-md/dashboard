<script>
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import RcKeyValue from '@shell/components/form/RcKeyValue.vue';
import { RcContentGroup } from '@components/Layout';
import { LabeledInput } from '@components/Form/LabeledInput';
import { set } from '@shell/utils/object';

export default {
  components: {
    ArrayListGrouped, RcKeyValue, LabeledInput, RcContentGroup
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

    docsUrl: {
      type:     String,
      required: true,
    },
  },

  data() {
    return { entries: [] };
  },

  created() {
    if (!this.value.spec.rkeConfig?.registries?.mirrors) {
      set(this.value, 'spec.rkeConfig.registries.mirrors', {});
    }

    const mirrorMap = this.value.spec.rkeConfig?.registries?.mirrors || {};

    for ( const hostname in mirrorMap ) {
      this.entries.push({
        hostname,
        endpoints: (mirrorMap[hostname].endpoint || []).join(', '),
        rewrite:   mirrorMap[hostname].rewrite || {},
      });
    }
  },

  computed: {
    defaultAddValue() {
      return {
        hostname:  '',
        endpoints: '',
        rewrite:   {}
      };
    },
  },

  methods: {
    itemTitle({ row, i }) {
      return row.value.hostname || this.t('registryMirror.itemTitle', { index: i + 1 });
    },

    update(entries) {
      const mirrors = {};

      for ( const entry of entries ) {
        if ( !entry.hostname || mirrors[entry.hostname] ) {
          continue;
        }

        mirrors[entry.hostname] = { endpoint: entry.endpoints.split(/\s*,\s*/).map((x) => x.trim()) };
        if (entry.rewrite) {
          mirrors[entry.hostname].rewrite = entry.rewrite;
        }
      }
      set(this.value, 'spec.rkeConfig.registries.mirrors', mirrors);
    },
  }
};
</script>

<template>
  <RcContentGroup>
    <t
      k="registryMirror.description"
      :url="docsUrl"
      raw
      class="text-deemphasized"
    />
    <ArrayListGrouped
      v-model:value="entries"
      :add-label="t('registryMirror.addLabel')"
      :default-add-value="defaultAddValue"
      :initial-empty-row="true"
      :mode="mode"
      :use-rc="true"
      :get-item-title="itemTitle"
      @update:value="update"
    >
      <template #default="{row}">
        <RcContentGroup>
          <div class="input-row">
            <LabeledInput
              v-model:value="row.value.hostname"
              :label="t('registryMirror.hostnameLabel')"
              :placeholder="t('registryMirror.hostnamePlaceholder')"
              :mode="mode"
            />
            <LabeledInput
              v-model:value="row.value.endpoints"
              :label="t('registryMirror.endpointsLabel')"
              :placeholder="t('registryMirror.endpointsPlaceholder')"
              :mode="mode"
            />
          </div>
          <RcKeyValue
            v-model:value="row.value.rewrite"
            :mode="mode"
            :title="t('registryMirrorRewrite.header')"
            :add-label="t('registryMirrorRewrite.addLabel')"
            :read-allowed="false"
            :key-label="t('registryMirrorRewrite.keyLabel')"
            :key-placeholder="t('registryMirrorRewrite.keyPlaceholder')"
            :value-label="t('registryMirrorRewrite.valueLabel')"
            :value-placeholder="t('registryMirrorRewrite.valuePlaceholder')"
            add-icon="icon-plus"
            use-rc-button
          >
            <template #title>
              <h4 class="m-0">
                {{ t('registryMirrorRewrite.header') }}
              </h4>
              <t
                k="registryMirrorRewrite.description"
                :url="docsUrl"
                raw
                class="text-deemphasized"
              />
            </template>
          </RcKeyValue>
        </RcContentGroup>
      </template>
    </ArrayListGrouped>
  </RcContentGroup>
</template>
