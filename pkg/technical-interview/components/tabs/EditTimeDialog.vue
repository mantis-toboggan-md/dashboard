<script>
import Vue from 'vue';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput },

  data() {
    return {
      time: {
        seconds: 0,
        minutes: 0,
        hours:   0
      }
    };
  },

  computed: {
    validHours() {
      if (!this.time.hours) {
        return null;
      }

      return /^-?\d+$/.test(this.time.hours) ? 'success' : 'error';
    },
    validMinutes() {
      if (!this.time.minutes) {
        return null;
      }

      return /^-?\d+$/.test(this.time.minutes) ? 'success' : 'error';
    },
    validSeconds() {
      if (!this.time.seconds) {
        return null;
      }

      return /^-?\d+$/.test(this.time.seconds) ? 'success' : 'error';
    },
    valid() {
      if (!this.time) {
        return false;
      }

      return /^-?\d+$/.test(this.time.hours) && /^-?\d+$/.test(this.time.minutes) && /^-?\d+$/.test(this.time.seconds);
    }
  },

  methods: {
    showDialog() {
      this.$modal.show('editTimeDialog');
    },
    closeDialog() {
      const defaultTime = {
        seconds: 0,
        minutes: 0,
        hours:   0
      };

      Vue.set(this, 'time', defaultTime);
      this.$modal.hide('editTimeDialog');
    },
    saveDialog() {
      this.$emit('saved', this.time);
      this.closeDialog();
    }
  }
};
</script>

<template>
  <modal
    name="editTimeDialog"
    height="auto"
    :scrollable="true"
  >
    <div class="edit-time-dialog">
      <h4>
        {{ t('interview.tabs.timechecker.dialog.header') }}
      </h4>
      <div class="custom mt-10">
        <div class="fields">
          <LabeledInput
            v-model="time.hours"
            v-focus
            label-key="interview.tabs.timechecker.dialog.hours"
            :status="validHours"
          />
          <LabeledInput
            v-model="time.minutes"
            v-focus
            label-key="interview.tabs.timechecker.dialog.minutes"
            :status="validMinutes"
          />
          <LabeledInput
            v-model="time.seconds"
            v-focus
            label-key="interview.tabs.timechecker.dialog.seconds"
            :status="validSeconds"
          />
        </div>
        <div class="dialog-buttons mt-20">
          <button
            class="btn role-secondary"
            :disabled="!valid"
            @click="saveDialog()"
          >
            {{ t('generic.save') }}
          </button>
          <button
            class="btn role-secondary"
            @click="closeDialog()"
          >
            {{ t('generic.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </modal>
</template>
<style lang="scss" scoped>
  .edit-time-dialog {
    padding: 10px;

    h4 {
      font-weight: bold;
      text-align: center;
    }

    .dialog-panel {
      display: flex;
      flex-direction: column;
      min-height: 100px;

      p {
        margin-bottom: 5px;
      }
      .dialog-info {
        flex: 1;
      }
    }
    .dialog-buttons {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;

      > *:not(:last-child) {
        margin-right: 10px;
      }
    }
  }
</style>
