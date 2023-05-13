<script>
import Vue from 'vue';
import EditTimeDialog from './EditTimeDialog.vue';

const TIME_CONVERSION_UNIT = 60;
const MS_IN_SEC = 1000;

export default {
  name: 'TimeCheckerTab',

  components: { EditTimeDialog },
  computed:   {
    returnComparisonText() {
      const t = this.$store.getters['i18n/t'];
      const difference = this.providedDate - this.currentDate;

      if (difference > 0) {
        return t('interview.tabs.timechecker.more');
      } else if (difference < 0) {
        return t('interview.tabs.timechecker.less');
      } else {
        return t('interview.tabs.timechecker.equal');
      }
    },
    returnTimeText() {
      const t = this.$store.getters['i18n/t'];

      if (!this.useProvidedDate) {
        return t('interview.tabs.timechecker.display', {
          date: this.currentDate.toLocaleDateString(), hours: this.currentDate.getHours(), minutes: this.currentDate.getMinutes()
        });
      } else {
        return t('interview.tabs.timechecker.display', {
          date: this.providedDate.toLocaleDateString(), hours: this.providedDate.getHours(), minutes: this.providedDate.getMinutes()
        });
      }
    }
  },

  data() {
    return {
      currentDate:     new Date(),
      providedDate:    new Date(),
      useProvidedDate: false
    };
  },

  created() {
    // TODO: Should only update it if this tab is active.
    setInterval(this.getCurrentDateTime, 60 * 1000);
  },

  methods: {
    getCurrentDateTime() {
      const today = new Date();

      this.currentDate = today;
    },
    resetTime() {
      Vue.set(this, 'useProvidedDate', false);
    },
    showEditTimeDialog( ev) {
      ev.target?.blur();
      ev.preventDefault();
      ev.stopPropagation();

      this.$refs.editTimeDialog.showDialog();
    },
    timeChanged(ev) {
      const newSeconds = ev.seconds;
      const newMinutes = ev.minutes;
      const newHours = ev.hours;
      const totalNewSeconds = (TIME_CONVERSION_UNIT * TIME_CONVERSION_UNIT * parseInt(newHours)) + (TIME_CONVERSION_UNIT * parseInt(newMinutes)) + parseInt(newSeconds);
      const today = new Date();
      const newDate = new Date(today.getTime() + totalNewSeconds * MS_IN_SEC);

      Vue.set(this, 'providedDate', newDate);
      Vue.set(this, 'useProvidedDate', true);
    }
  },

  watch: {}
};
</script>
<template>
  <div class="container">
    <div class="inner">
      <label v-if="!!currentDate">{{ returnTimeText }}</label>
      <label v-if="!!useProvidedDate">{{ returnComparisonText }}</label>
    </div>
    <div class="buttons">
      <button
        type="button"
        class="left-bttn"
        @click="showEditTimeDialog($event)"
      >
        {{ t('interview.tabs.timechecker.edit') }}
      </button>
      <button
        type="button"
        @click="resetTime"
      >
        {{ t('interview.tabs.timechecker.reset') }}
      </button>
    </div>
    <EditTimeDialog
      ref="editTimeDialog"
      @saved="timeChanged"
    />
  </div>
</template>
<style lang="scss" scoped>
  .container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .inner{
    display: flex;
    flex-direction: column;
  }
  .buttons{
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }
  .left-bttn{
    margin-right: 10px;
  }
</style>
