
<script>
import Banner from '@/components/Banner';
import AsyncButton from '@/components/AsyncButton';
import { MANAGEMENT } from '~/config/types';
import { toggleLocalAuth } from '~/utils/auth';

export default {
  components: {
    AsyncButton,
    Banner
  },

  props: {
    tArgs: {
      type:     Object,
      required: true,
      default:  () => { },
    },
    disable: {
      type:     Function,
      required: true,
      default:  () => { },
    },
    edit: {
      type:     Function,
      required: true,
      default:  () => { },
    }
  },

  async fetch() {
    this.localConfig = await this.$store.dispatch(`management/find`, { type: MANAGEMENT.AUTH_CONFIG, id: 'local' });
  },

  data() {
    return { localConfig: null };
  },

  computed: {
    values() {
      return Object.entries(this.table);
    },

    localEnabled() {
      return !!this.localConfig?.enabled;
    }
  },

  methods: {
    async toggleLocal(enable, btnCB) {
      try {
        await toggleLocalAuth(this.$store);
        btnCB(true);
      } catch (err) {
        console.error(err);
        btnCB(false);
      }
    }
  }
};
</script>

<template>
  <div>
    <Banner color="info clearfix" class="banner">
      <div class="text">
        {{ localEnabled ? t('authConfig.stateBanner.local.enabled', tArgs) : t('authConfig.stateBanner.local.disabled', tArgs) }}
      </div>
      <AsyncButton
        v-if="localEnabled"
        class="ml-10"
        mode="disable"
        size="sm"
        action-color="bg-error"
        @click="cb=>toggleLocal(false, cb)"
      />
      <AsyncButton
        v-else
        class="ml-10"
        mode="enable"
        size="sm"
        action-color="bg-error"
        @click="cb=>toggleLocal(true, cb)"
      />
    </Banner>

    <Banner color="success clearfix" class="banner">
      <div class="text">
        {{ t('authConfig.stateBanner.enabled', tArgs) }}
      </div>
      <button type="button" class="btn-sm role-primary" @click="edit">
        {{ t('action.edit') }}
      </button>
      <AsyncButton class="ml-10" mode="disable" size="sm" action-color="bg-error" @click="disable" />
    </Banner>

    <table v-if="!!$slots.rows" class="values">
      <slot name="rows"></slot>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.banner {
  display: flex;
    align-items: center;
  .text {
    flex: 1;
  }
}

.values {
  tr td:not(:first-of-type) {
    padding-left: 10px;
  }
}

</style>
