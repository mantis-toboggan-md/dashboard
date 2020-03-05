<script>
import { pickBy } from 'lodash';
import provisioners from './provisioner-params';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';
import UnitInput from '@/components/form/UnitInput';
import Checkbox from '@/components/form/Checkbox';
import KeyValue from '@/components/form/KeyValue';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    UnitInput,
    Checkbox,
    KeyValue
  },
  props:      {
    mode: {
      type:    String,
      default: 'edit'
    },

    provisioner: {
      type:    String,
      default: 'kubernetes.io/no-provisioner'
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    secrets: {
      type:    Array,
      default: () => []
    },

    namespaces: {
      type:    Array,
      default: () => []
    }
  },

  data() {
    const { parameters = {} } = this.value;

    return { params: parameters, hideOptional: true };
  },

  computed: {

    config() {
      return provisioners[this.provisioner] || {};
    },

    // separate available parameters into ungrouped and groups maps
    // for resource ref parameters, set 'options' key to available resources
    paramOptions() {
      const params = this.config ? this.config.params : {};

      const groups = {};
      const ungrouped = {};

      for (const param in params) {
        const inputField = params[param];

        if (inputField._type === 'resource') {
          inputField.options = inputField._filterBy ? this.secrets.filter(inputField._filterBy) : this.secrets;
        }

        // check if input field has a _group key and add it to groups map
        if (inputField._group) {
          if (!groups[inputField._group]) {
            groups[inputField._group] = {};
          }
          groups[inputField._group][param] = inputField;
        } else {
          ungrouped[param] = inputField;
        }
      }

      return { groups, ungrouped };
    },

    availableParamGroups() {
      const config = provisioners[this.provisioner];

      return pickBy(this.paramOptions.groups, (group, groupName) => {
        if (config[groupName]) {
          if (config[groupName]._isAvailable) {
            return config[groupName]._isAvailable(this.params);
          } else {
            return false;
          }
        } else {
          return true;
        }
      });
    },

    customParams: {
      get() {
        return pickBy(this.params, (value, key) => {
          return !this.config[key];
        });
      },
      set(neu) {
        for (const key in neu) {
          this.$set(this.params, key, neu[key]);
        }
      }
    }
  },

  methods: {
    // return name of input component to use
    componentFor(parameter) {
      if (parameter._type === 'resource') {
        return 'LabeledSelect';
      } else {
        return parameter._type;
      }
    },

    // some params are only available when others are set
    isAvailable(parameter) {
      if (parameter._isAvailable) {
        return parameter._isAvailable(this.params);
      } else {
        return true;
      }
    },

    // add param to params object
    // some input fields have more involved update logic in a _set function eg setting both name and namespace fields
    setParameter(e, parameter) {
      const inputField = this.config.params[parameter];

      if (inputField._set) {
        inputField._set(e, this);
      } else {
        this.$set(this.params, parameter, e);
      }

      this.$nextTick(() => this.update());
    },

    update() {
      const out = { ...this.value, parameters: this.params };

      this.$emit('input', out);
    }

  }
};
</script>

<template>
  <div>
    <div class="param-container">
      <div v-for="(param, key) in paramOptions.ungrouped" :key="key" :class="{'short':param._short}">
        <component
          :is="componentFor(param)"
          v-if="isAvailable(param)"
          v-bind="param"
          :value="params[key]"
          :disabled="param._isDisabled ? param._isDisabled(params) : false"
          @input="e=>setParameter(e, key)"
        />
      </div>
    </div>
    <div v-for="(group, key) in availableParamGroups" :key="key">
      <template v-if="key==='optional'">
        <button class="btn btn-sm role-link" @click="hideOptional = !hideOptional">
          {{ hideOptional ? 'show' : 'hide' }} additional options
        </button>
        <div v-if="!hideOptional" class="param-container">
          <div v-for="(param, pKey) in group" :key="pKey" :class="{'short':param._short}">
            <component
              :is="componentFor(param)"
              v-if="isAvailable(param)"
              v-bind="param"
              :value="params[pKey]"
              :disabled="param._isDisabled ? param._isDisabled(params) : false"
              @input="e=>setParameter(e, pKey)"
            />
          </div>
        </div>
      </template>
      <template v-else>
        <h5 v-if="config[key]">
          {{ config[key].title }}
        </h5>
        <div class="param-container">
          <div v-for="(param, pKey) in group" :key="pKey" :class="{'short':param._short}">
            <component
              :is="componentFor(param)"
              v-if="isAvailable(param)"
              v-bind="param"
              :value="params[pKey]"
              :disabled="param._isDisabled ? param._isDisabled(params) : false"
              @input="e=>setParameter(e, pKey)"
            />
          </div>
        </div>
      </template>
    </div>
    <div class="row">
      <KeyValue v-model="customParams" add-label="Add Custom Parameter" :mode="mode" :protip="false" :read-allowed="false" />
    </div>
  </div>
</template>

<style lang='scss' scoped>
.param-container{
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    & > div {
        flex-basis: 50%;
        padding: 10px 5px 10px 5px;
      &.short{
        flex-basis: 25%;
      }
    }
}
</style>
