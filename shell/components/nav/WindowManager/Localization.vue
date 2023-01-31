<script>
import Window from './';
export default {
  components: { Window },

  props: {
    active: {
      type:    Boolean,
      default: false
    }
  }

};
</script>

<template>
  <Window>
    <template #body>
      <div>wow_its_fucking_nothing.jpeg</div>
    </template>
    <template #title>
      download button go here
    </template>
  </Window>
</template>
