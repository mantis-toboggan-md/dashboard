<template>
  <div class="dropdown-item">
    <div>
      <input
        :id="el.label"
        v-model="el.isChecked"
        type="checkbox"
        :name="el.label"
        :value="el.label"
        checked="true"
      />
      <label for="myCheckbox">{{ el.label }}</label>
    </div>
  </div>
</template>

<script>
export default {
  name:  'AppDropdownItem',
  props: { el: { type: Object, default: null } },
  data() {
    return {};
  },
};
</script>

<style scoped>
.dropdown-item div {
  padding: 5px 10px;
  line-height: 30px;
}
.dropdown-item div:hover {
  cursor: pointer;
  background: rgba(0, 0, 0, 0.04);
}

label {
  margin-left: 5px;
}
</style>
