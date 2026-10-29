<script>

import ClusterMembershipEditor from '@shell/components/form/Members/ClusterMembershipEditor';
import CreateEditView from '@shell/mixins/create-edit-view';
import { Banner } from '@components/Banner';
import { RcContentGroup } from '@components/Layout';

export default {
  components: {
    ClusterMembershipEditor, Banner, RcContentGroup
  },
  mixins: [CreateEditView],
  props:  {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
    onMembershipUpdate: {
      type:     Function,
      required: true
    }
  }
};
</script>
<template>
  <RcContentGroup>
    <Banner
      v-if="isEdit"
      color="info"
      class="m-0"
    >
      {{ t('cluster.memberRoles.removeMessage') }}
    </Banner>
    <ClusterMembershipEditor
      :mode="mode"
      :parent-id="value.mgmt ? value.mgmt.id : null"
      :use-rc-button="true"
      @membership-update="onMembershipUpdate"
    />
  </RcContentGroup>
</template>
