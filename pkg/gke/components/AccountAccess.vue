<script lang="ts">
import { defineComponent } from 'vue';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import { mapGetters } from 'vuex';

export default defineComponent({
  name: 'EKSAccountAccess',

  components: {
    LabeledInput,
    SelectCredential
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    credential: {
      type:    String,
      default: null
    },

    project: {
      type:    String,
      default: ''
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isAuthenticated(): boolean {
      return !!this.credential;
    },

    CREATE(): string {
      return _CREATE;
    },

    VIEW(): string {
      return _VIEW;
    },

  },

  methods: {
    authenticate() {
      console.log('**** authenticate');
    }
  },
});
</script>

<template>
  <div
    :class="{'showing-form': !credential}"
    class="credential-project"
  >
    <div class="project mb-10">
      <LabeledInput
        :disabled="mode!=='create'"
        :value="project"
        label-key="gke.project.label"
        required
        @input="$emit('update:project', $event)"
      />
    </div>
    <div
      class="select-credential-container mb-10"
    >
      <SelectCredential
        :value="credential"
        data-testid="crugke-select-credential"
        :mode="mode === VIEW ? VIEW : CREATE"
        provider="gcp"
        :default-on-cancel="true"
        :showing-form="!credential"
        class="select-credential"
        :cancel="()=>$emit('cancel-credential')"
        @input="$emit('update:credential', $event)"
      />
    </div>
    <div
      v-if="!!credential"
      class="auth-button-container mb-10"
    >
      <button
        type="button"
        class="btn role-secondary"
        @click="authenticate"
      >
        {{ t('gke.authenticate') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss">
  .credential-project {
    display: flex;

    .project {
      flex-basis: 50%;
      flex-grow: 0;
      margin: 0 1.75% 0 0;
    }

    &.showing-form {
      flex-grow:1;
      flex-direction: column;

      &>.project {
        margin: 0;
      }

      &>.select-credential-container{
      display:flex;
      flex-direction: column;
      flex-grow: 1;
      }
    }

    &>.select-credential-container{
      flex-basis: 50%;
      margin: 0 1.75% 0 0;

      &>.select-credential{
        flex-grow: 1;
      }

    }
  }

  .auth-button-container {
    align-content: center;
  }

</style>
