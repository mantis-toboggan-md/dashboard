<template>
  <div class="dropdown" @click="toggle">
    <div class="button-container">
      <div class="button vs__dropdown-toggle">
        <div class="vs__selected-options">
          <div class=".vs--single .vs__selected clippp">
            <span v-if="myDataEnabled.length > 0">
              <span>{{ myDataEnabled.join(', ') }}</span>
            </span>
            <span v-else>Choose An Option</span>
          </div>
        </div>
        <div class="vs__actions"></div>
      </div>
    </div>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AppDropdown',
  provide() {
    return { sharedState: this.sharedState };
  },
  props: { myData: { type: Array, default: null } },
  data() {
    return { sharedState: { active: false } };
  },
  computed: {
    myDataEnabled() {
      return this.myData.filter((el) => {
        return el.enabled === true;
      })
        .map((el) => {
          return el.label;
        });
    }
  },
  methods:  {
    toggle() {
      this.sharedState.active = !this.sharedState.active;
    },
    displayMyData() {
      return this.myDataEnabled.join(', ');
    }
  },
};
</script>

<style scoped>

.dropdown {
  width: 325px;
  position: relative;
  background: var(--input-bg);
  border-radius: 4px;
}

.dropdown:hover {
  cursor: pointer;
  background: var(--input-hover-bg);
}

.button-container {
  padding: 12px;
  border-top: 4px;
  border: solid var(--border-width) var(--input-border);
  border-radius: 4px;
}

.button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
  background: transparent;
}

.underline {
  width: 100%;
  height: 2px;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
}

.selected-items {
  font-size: 0.9em;
  margin-top: 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 90%;
}

.dropdown:hover .underline {
  background: rgba(0, 0, 0, 0.8);
}

.clippp {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 250px;
}
</style>
