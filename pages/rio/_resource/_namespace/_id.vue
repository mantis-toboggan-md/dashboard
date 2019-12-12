<script>
import { TO_FRIENDLY, FRIENDLY } from '@/config/friendly';
import RioDetail, { watchQuery, asyncData } from '@/components/RioDetail';
import FriendlyDetail from '@/components/FriendlyDetail';

export default {
  name:       'RioNamespaceResourceId',
  components: { RioDetail, FriendlyDetail },

  asyncData(ctx) {
    const { params, store } = ctx;
    const { resource } = params;
    const friendly = FRIENDLY[resource];
    const type = friendly.type;

    if (TO_FRIENDLY[type].vuex) {
      return store.dispatch(`friendly/init`, { ctx }).then(() => {
        return { vuex: true, type };
      });
    } else {
      return asyncData();
    }
  },
  watchQuery
};
</script>

<template>
  <FriendlyDetail v-if="vuex" :type="type" />
  <RioDetail v-else v-bind="_data" />
</template>
