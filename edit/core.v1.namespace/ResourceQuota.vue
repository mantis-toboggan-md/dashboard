<script>
import { mapState, mapMutations, mapActions } from 'vuex';
import UnitInput from '@/components/form/UnitInput';

export default {
  components: { UnitInput },
  props:      {
    registerAfterHook: {
      type:    Function,
      default: null
    },
    saveURL: {
      type:    String,
      default: null
    },
    vuexModule: {
      type:    String,
      default: null
    }
  },
  computed: {
    ...mapState({
      limitsCPU(state) {
        return state.friendly[this.vuexModule].limitsCPU;
      },
      limitsMemory(state) {
        return state.friendly[this.vuexModule].limitsMemory;
      },
      reqsCPU(state) {
        return state.friendly[this.vuexModule].reqsCPU;
      },
      reqsMemory(state) {
        return state.friendly[this.vuexModule].reqsMemory;
      },

      mode(state) {
        return state.friendly.mode;
      }
    })
  },
  created() {
    this.registerAfterHook(this.save);
  },
  methods: {
    ...mapActions({
      save(dispatch) {
        return dispatch(`friendly/${ this.vuexModule }/createQuota`, this.saveURL );
      }
    }),
    ...mapMutations({
      update(commit, payload) {
        return commit(`friendly/${ this.vuexModule }/update`, payload);
      }
    })
  }
};
</script>

<template>
  <div>
    <div class="row">
      <span class="col span-6">
        <UnitInput
          :value="limitsCPU"
          suffix="CPUs"
          label="CPU Limit"
          :input-exponent="2"
          :mode="mode"
          @input="e=>update({limitsCPU:e})"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          :value="reqsCPU"
          suffix="CPUs"
          label="CPU Reservation"
          :input-exponent="2"
          :mode="mode"
          @input="e=>update({reqsCPU:e})"
        />
      </span>
    </div>
    <div class="row">
      <span class="col span-6">
        <UnitInput
          :value="limitsMemory"
          label="Memory Limit"
          suffix="B"
          :input-exponent="2"
          :mode="mode"
          @input="e=>update({limitsMemory:e})"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          :value="reqsMemory"
          label="Memory Reservation"
          suffix="B"
          :input-exponent="2"
          :mode="mode"
          @input="e=>update({reqsMemory:e})"
        />
      </span>
    </div>
  </div>
</template>
