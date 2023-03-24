<script lang="ts">
import Vue from 'vue';

interface Data {}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  data() {
    return {
      currentDate: new Date(),
      newDate:     new Date(),
      hours:       0,
      minutes:     0,
      seconds:     0,
    };
  },

  computed: {
    currentDateDisplay() {
      return this.currentDate.toLocaleTimeString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})
    },
    newDateDisplay() {
      return this.newDate.toLocaleString()
    },
    dateDifference() {
      if (this.newDate > this.currentDate) {
        return 'after';
      }
      if (this.newDate < this.currentDate) {
        return 'before';
      }

      return 'the same';
    }
  },

  methods: {
    updateDate(hours: number, minutes: number, seconds: number) {
      this.newDate = new Date();

      this.newDate.setHours(this.newDate.getHours() + hours);
      this.newDate.setMinutes(this.newDate.getMinutes() + minutes);
      this.newDate.setSeconds(this.newDate.getSeconds() + seconds);

      this.resetInputs();
    },
    resetInputs() {
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
    }
  },
});
</script>

<template>
  <div class="time-compare">
    <h2>Compare time</h2>

    <p>Current date and time: <strong>{{ currentDateDisplay }}</strong></p>
    <p>New date and time: <strong>{{ newDateDisplay }}</strong></p>

    <div
      class="inputs"
    >
      <label class="input-hours">Hours: <input
        v-model.number="hours"
        type="number"
      ></label>
      <label class="input-minutes">Minutes: <input
        v-model.number="minutes"
        type="number"
      ></label>
      <label class="input-seconds">Seconds: <input
        v-model.number="seconds"
        type="number"
      ></label>
      <button
        class="btn btn-sm role-primary"
        @click="updateDate(hours, minutes, seconds)"
      >
        Update
      </button>
    </div>

    <p 
      class="datetime-difference"
    >
      New date is {{ dateDifference }} current date.
    </p>
  </div>
</template>

<style lang="scss">
.time-compare {
  .inputs {
    margin-top: 1.5rem;
  }

  .input-hours, .input-minutes, .input-seconds {
    display: inline-block;
    margin-right: 0.5rem;
  }

  .datetime-difference {
    margin-top: 1.5rem;
  }
}
</style>