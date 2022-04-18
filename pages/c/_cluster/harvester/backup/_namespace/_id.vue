<script>
import ResourceDetail from '@/components/ResourceDetail';
import { HCI } from '@/config/types';

export default {
  name:        'BackupDetail',
  components:  { ResourceDetail },

  computed: {
    backupType() {
      return HCI.BACKUP;
    }
  }
};
</script>

<template>
  <ResourceDetail :resource-override="backupType" />
</template>
