<script>
export default {
  props: {
    columns: {
      type:    Array,
      default: () => []
    }
  }
};
</script>

<template>
  <div>
    <div
      v-for="col in columns"
      :key="col.path"
    >
      {{ col.label }}: {{ col.path }}
    </div>
  </div>
</template>
