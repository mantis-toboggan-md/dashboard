<template>
  <div v-if="active" class="dropdown-content">
    <slot />
  </div>
</template>

<script>
export default {
  name:     'AppDropdownContent',
  inject:   ['sharedState'],
  computed: {
    active() {
      return this.sharedState.active;
    },
  },
};
</script>

<style scoped>
.dropdown-content {
  box-shadow: 0 2px 4px -1px rgb(0 0 0 / 20%), 0 4px 5px 0 rgb(0 0 0 / 14%), 0 1px 10px 0 rgb(0 0 0 / 12%);
  min-width: calc(100% + 50px);
  max-height: 250px;
  overflow: auto;
  position: relative;
  background: #fff;
  z-index: 100;
}
</style>
