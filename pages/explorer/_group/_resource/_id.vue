<script>
import { get } from '@/utils/object';
import { TO_FRIENDLY } from '@/config/friendly';
import ExplorerDetail from '@/components/ExplorerDetail';
import RioDetail, { watchQuery } from '@/components/RioDetail';
import FriendlyDetail from '@/components/FriendlyDetail';
export default {
  name:       'ExplorerGroupResourceId',
  components: {
    RioDetail,
    ExplorerDetail,
    FriendlyDetail
  },
  asyncData(ctx) {
    const { route, store } = ctx;

    const type = get(route.params, 'resource');

    if (TO_FRIENDLY[type]) {
      if (TO_FRIENDLY[type].vuex) {
        store.dispatch(`friendly/init`, { ctx });

        return { vuex: true, type };
      } else {
        return import('@/components/RioDetail').then(module => module.asyncData(ctx));
      }
    } else {
      return import('@/components/ExplorerDetail').then(module => module.asyncData(ctx));
    }
  },
  destroyed() {
    this.$store.commit(`friendly/cleanState`);
  },
  watchQuery,
};
</script>

<template>
  <FriendlyDetail v-if="vuex" :type="type" />
  <div v-else>
    <RioDetail v-if="!!model" v-bind="_data" />
    <ExplorerDetail v-else :async-data="_data" />
  </div>
</template>
