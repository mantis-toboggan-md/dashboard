<script lang="ts">
import Vue from 'vue';

interface Data {
    currentTime: Date;
    userProvidedTime: string | null,
}

export default Vue.extend({
  data(): Data {
    return { currentTime: new Date(), userProvidedTime: null };
  },

  //   mounted() {
  //     setInterval(() => {
  //       this.setCurrentTime();
  //     }, 1000);
  //   },

  computed: {
    compareDates() {
      const userProvidedDate = new Date(this.currentTime);
      const [hours, minutes, seconds] = this.userProvidedTime?.split(':') || [];

      userProvidedDate.setHours(Number(hours));
      userProvidedDate.setMinutes(Number(minutes));
      userProvidedDate.setSeconds(Number(seconds));

      if (userProvidedDate.getTime() > this.currentTime.getTime()) {
        return 'after the current time';
      }

      if (userProvidedDate.getTime() < this.currentTime.getTime()) {
        return 'before the current time';
      }

      return 'the same as the current time';
    },
  },

  methods: {
    // setCurrentTime() {
    //   this.currentTime = new Date();
    // },
    formattedTime() {
      return this.currentTime.toLocaleString('en-GB', {
        weekday: 'short',
        year:    'numeric',
        month:   'long',
        day:     'numeric',
        hour:    '2-digit',
        minute:  '2-digit',
        second:  '2-digit'
      });
    },
  },
});
</script>

<template>
  <div>
    <span>Current date and time: {{ formattedTime() }}</span>
    <div>
      <label for="user-time">Provide time to be compared to the current one (hh:mm:ss):</label>
      <input
        id="user-time"
        v-model="userProvidedTime"
        type="time"
        step="1"
      >
      <br>
      <span v-if="userProvidedTime">The date you have chosen is {{ compareDates }}</span>
    </div>
  </div>
</template>
