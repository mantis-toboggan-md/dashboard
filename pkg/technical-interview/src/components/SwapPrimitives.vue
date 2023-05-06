<script>
import Vue from 'vue';
import FileSelector from '@shell/components/form/FileSelector.vue';

export default Vue.extend({
  components: { FileSelector },

  data() {
    return { uploadedFile: '', swappedPrimitives: null };
  },

  methods: {
    onFileSelected(jsonObj) {
      this.uploadedFile = jsonObj;
      this.swappedPrimitives = null;
    },
    swapPrimitives() {
      if (!this.uploadedFile) {
        return;
      }

      this.swappedPrimitives = {};
      const uploadedObject = JSON.parse(this.uploadedFile);

      Object.entries(uploadedObject).forEach((entry) => {
        const [key, val] = entry;

        if (this.isPrimitive(val)) {
          this.swappedPrimitives[val] = key;
        } else {
          this.swappedPrimitives[key] = val;
        }
      });
    },
    isPrimitive(val) {
      return val !== Object(val);
    },
  },
});
</script>

<template>
  <div>
    <FileSelector
      class="role-tertiary add mb-10"
      label="Upload json"
      @selected="onFileSelected"
    />
    <br>
    <h3 v-if="uploadedFile">
      <pre>
        {{ uploadedFile }}
      </pre>
    </h3>
    <button
      class="btn mb-5"
      @click="swapPrimitives"
    >
      Swap Primitives
    </button>
    <h3 v-if="swappedPrimitives">
      <pre>
        {{ swappedPrimitives }}
      </pre>
    </h3>
  </div>
</template>
