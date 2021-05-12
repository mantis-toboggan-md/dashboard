<script>
export default {
  name: 'CheckboxSelectContent',

  inject: ['dropdownToggle'],

  computed: {
    active() {
      return this.dropdownToggle.active;
    },
  },
};
</script>

<template>
  <transition name="dropdown-content">
    <div v-if="active" class="dropdown-content">
      <slot />
    </div>
  </transition>
</template>

<style scoped>
.dropdown-content {
  box-shadow: 0 2px 4px -1px rgb(0 0 0 / 20%), 0 4px 5px 0 rgb(0 0 0 / 14%), 0 1px 10px 0 rgb(0 0 0 / 12%);
  width: 323px;
  max-height: 250px;
  overflow: auto;
  position: absolute;
  background: var(--input-bg);
  z-index: 100;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
}
.dropdown-content-enter-active,
.dropdown-content-leave-active {
  transition: all 0.2s;
}
.dropdown-content-enter,
.dropdown-content-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
.dropdown-content ::v-deep.repo {
  border-radius: 0;
}
</style>
