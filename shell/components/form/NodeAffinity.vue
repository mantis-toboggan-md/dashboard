<script>
import debounce from 'lodash/debounce';
import { _VIEW } from '@shell/config/query-params';
import { mapGetters } from 'vuex';
import { get, isEmpty, clone } from '@shell/utils/object';
import { NODE } from '@shell/config/types';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { randomStr } from '@shell/utils/string';
import { RcSection, RcSectionActions } from '@components/RcSection';
import { RcButton } from '@components/RcButton';
import { RcCounterBadge } from '@components/Pill';

export default {
  emits: ['update:value'],

  components: {
    RcSection, RcSectionActions, RcButton, RcCounterBadge, MatchExpressions, LabeledSelect, LabeledInput
  },

  props: {
    // value should be NodeAffinity or VolumeNodeAffinity
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'create'
    },

    // has select for matching fields or expressions (used for node affinity)
    // https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.25/#nodeselectorterm-v1-core
    matchingSelectorDisplay: {
      type:    Boolean,
      default: false,
    },
  },

  data() {
    // VolumeNodeAffinity only has 'required' field
    if (this.value.required) {
    } else {
    }

    return {
      nodeSelectorTerms:         null,
      allSelectorTerms:          null,
      weightedNodeSelectorTerms: null,
      defaultWeight:             1,
      // rules in MatchExpressions.vue can not catch changes what happens on parent component
      // we need re-render it via key changing
      rerenderNums:              randomStr(4)
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    isView() {
      return this.mode === _VIEW;
    },
    hasWeighted() {
      return !!this.weightedNodeSelectorTerms;
    },
    node() {
      return NODE;
    },
    affinityOptions() {
      const out = [this.t('workload.scheduling.affinity.preferred'), this.t('workload.scheduling.affinity.required')];

      return out;
    }
  },

  created() {
    if (this.value.required) {
      this.nodeSelectorTerms = this.value.required.nodeSelectorTerms;
    } else {
      const { preferredDuringSchedulingIgnoredDuringExecution = [], requiredDuringSchedulingIgnoredDuringExecution = {} } = this.value;
      const { nodeSelectorTerms = [] } = requiredDuringSchedulingIgnoredDuringExecution;
      const allSelectorTerms = [...preferredDuringSchedulingIgnoredDuringExecution, ...nodeSelectorTerms].map((term) => {
        const neu = clone(term);

        neu._id = randomStr(4);
        if (term.preference) {
          Object.assign(neu, term.preference);
          delete neu.preference;
        }

        return neu;
      });

      this.allSelectorTerms = allSelectorTerms;
      this.weightedNodeSelectorTerms = preferredDuringSchedulingIgnoredDuringExecution;
    }

    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    update() {
      const out = {};
      const requiredDuringSchedulingIgnoredDuringExecution = { nodeSelectorTerms: [] };
      const preferredDuringSchedulingIgnoredDuringExecution = [] ;

      this.allSelectorTerms.forEach((t) => {
        const term = { ...t };

        // the 'matching' field isn't part of the affinity spec: including this in the save request will cause a flood of errors that might cause the request to fail
        // same deal with term.preference.weight
        if (term.matchExpressions) {
          term.matchExpressions = (term.matchExpressions || []).map((expression) => {
            const out = { ...expression };

            delete out.matching;

            return out;
          });
        }

        if (term.matchFields) {
          term.matchFields = (term.matchFields || []).map((field) => {
            const out = { ...field };

            delete out.matching;

            return out;
          });
        }

        if (term.weight) {
          const neu = { weight: term.weight, preference: term };

          delete neu.preference.weight;

          preferredDuringSchedulingIgnoredDuringExecution.push(neu);
        } else {
          requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.push(term);
        }
      });

      if (preferredDuringSchedulingIgnoredDuringExecution.length) {
        out.preferredDuringSchedulingIgnoredDuringExecution = preferredDuringSchedulingIgnoredDuringExecution;
      }
      if (requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.length) {
        out.requiredDuringSchedulingIgnoredDuringExecution = requiredDuringSchedulingIgnoredDuringExecution;
      }

      this.$emit('update:value', out);
    },

    addTerm() {
      this.allSelectorTerms.push({ matchExpressions: [], _id: randomStr(4) });
      this.queueUpdate();
    },

    removeTerm(index) {
      this.allSelectorTerms.splice(index, 1);
      this.rerenderNums = randomStr(4);
      this.queueUpdate();
    },

    changePriority(term) {
      if (term.weight) {
        delete term['weight'];
      } else {
        term['weight'] = 1;
      }
      this.update();
    },

    priorityDisplay(term) {
      return 'weight' in term ? this.t('workload.scheduling.affinity.preferred') : this.t('workload.scheduling.affinity.required');
    },

    updateExpressions(row, expressions) {
      const expressionsMatching = {
        matchFields:      [],
        matchExpressions: []
      };

      if (expressions.length) {
        expressions.forEach((expression) => {
          expressionsMatching[expression.matching || 'matchExpressions'].push(expression);
        });

        row['matchFields'] = expressionsMatching.matchFields;
        row['matchExpressions'] = expressionsMatching.matchExpressions;

        this.update();
      }
    },

    get,

    isEmpty
  }

};
</script>

<template>
  <div
    class="row"
    @update:value="queueUpdate"
  >
    <div class="col span-12">
      <template
        v-for="(term, i) in allSelectorTerms"
        :key="term._id"
      >
        <RcSection
          type="secondary"
          :expandable="true"
          :expanded="true"
          mode="with-header"
          :title="priorityDisplay(term) +' Node Selector'"
          class="mmt-3 mmb-3"
        >
          <template #counter>
            <RcCounterBadge
              :count="i + 1"
              type="inactive"
            />
          </template>
          <div class="row mmt-3 mmb-3">
            <div class="col span-9">
              <LabeledSelect
                :options="affinityOptions"
                :value="priorityDisplay(term)"
                :label="t('workload.scheduling.affinity.priority')"
                :mode="mode"
                :data-testid="`node-affinity-priority-index${i}`"
                @update:value="(changePriority(term))"
              />
            </div>
            <div
              v-if="'weight' in term"
              class="col span-3"
            >
              <LabeledInput
                v-model:value.number="term.weight"
                :mode="mode"
                type="number"
                min="1"
                max="100"
                :label="t('workload.scheduling.affinity.weight.label')"
                :placeholder="t('workload.scheduling.affinity.weight.placeholder')"
                :data-testid="`node-affinity-weight-index${i}`"
                @update:value="update"
              />
            </div>
          </div>
          <MatchExpressions
            :value="matchingSelectorDisplay ? term : term.matchExpressions"
            :matching-selector-display="matchingSelectorDisplay"
            :mode="mode"
            class="col span-12 mmt-3"
            :type="node"
            :show-remove="false"
            :data-testid="`node-affinity-expressions-index${i}`"
            @update:value="(updateExpressions(term, $event))"
          />
          <template #actions>
            <RcSectionActions
              v-if="!isView"
              :actions="[{ icon: 'trash', ariaLabel: t('generic.remove'), action: () => removeTerm(i) }]"
            />
          </template>
        </RcSection>
      </template>
      <div class="mmt-3">
        <RcButton
          v-if="!isView"
          size="small"
          variant="secondary"
          left-icon="plus"
          @click="addTerm"
        >
          {{ t('workload.scheduling.affinity.addNodeSelector') }}
        </RcButton>
      </div>
    </div>
  </div>
</template>

<style>
</style>
