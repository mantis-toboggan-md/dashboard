<script>
import { mapMutations } from 'vuex';
import cloneDeep from 'lodash/cloneDeep';
import { RIO } from '@/config/types';
import { get } from '@/utils/object';
import KeyValue from '@/components/form/KeyValue';
import StringMatch from '@/edit/rio.cattle.io.v1.router/StringMatch';
import LabeledInput from '@/components/form/LabeledInput';
export default {
  components: {
    StringMatch,
    KeyValue,
    LabeledInput
  },
  props:      {
    // ID to map to vuex store
    routeID: {
      type:     String,
      required: true
    }
  },
  data() {
    return { httpMethods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'] };
  },
  computed: {
    methods: {
      get() {
        return this.$store.state.friendly[RIO.ROUTER].matchMethods[this.routeID] || [];
      },
      set(methods) {
        this.updateMatchMethods({ id: this.routeID, methods });
      },
    },

    path: {
      get() {
        return this.$store.state.friendly[RIO.ROUTER].matchPaths[this.routeID] || {};
      },
      set(path) {
        this.updateMatchPath({ id: this.routeID, path });
      }
    },

    cookies: {
      get() {
        return this.$store.state.friendly[RIO.ROUTER].cookies[this.routeID] || [];
      },
      set(cookies) {
        // binary prop attached from KV component
        cookies.forEach(rule => delete rule.binary);
        this.updateCookies({ id: this.routeID, cookies: cloneDeep(cookies) });
      }
    },

    headers: {
      get() {
        const all = this.$store.state.friendly[RIO.ROUTER].matchHeaders[this.routeID] || [];

        return all.filter(header => header.name !== 'host');
      },
      set(headers) {
        // binary prop attached from KV component
        headers.forEach(rule => delete rule.binary);
        const hostHeader = { name: 'host', value: { exact: this.hostHeader } };

        this.updateMatchHeaders({ id: this.routeID, headers: [...cloneDeep(headers), hostHeader] });
      }
    },

    hostHeader: {
      get() {
        const all = this.$store.state.friendly[RIO.ROUTER].matchHeaders[this.routeID] || [];

        const host = all.filter(header => header.name === 'host')[0] || {};

        return get(host, 'value.exact');
      },
      set(header) {
        const newRule = { name: 'host', value: { exact: header } };

        this.updateMatchHeaders({ id: this.routeID, headers: [...this.headers, newRule] });
      }
    }
  },
  inject:   { disableInputs: { default: false } },
  methods: {

    isSelected(opt) {
      return this.methods.includes(opt);
    },

    ...mapMutations(`friendly/${ RIO.ROUTER }`, ['updateMatchMethods', 'updateMatchHeaders', 'updateCookies', 'updateMatchPath'])
  }
};
</script>

<template>
  <div class="match">
    <div class="row inputs">
      <v-select
        v-model="methods"
        class="col span-4"
        multiple
        :close-on-select="false"
        :options="httpMethods.filter(opt=>!isSelected(opt))"
        placeholder="Method"
        :disabled="disableInputs"
      />
      <div class="col span-4">
        <LabeledInput v-model="hostHeader" label="Host header" />
      </div>
      <div class="col span-4">
        <StringMatch v-model="path" label="Path" />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <h5>Headers</h5>
        <KeyValue
          v-model="headers"
          key-name="name"
          :as-map="false"
          add-label="Add Header Rule"
          :protip="false"
          :pad-left="false"
          :read-allowed="false"
        >
          <template v-slot:removeButton="buttonProps">
            <button :disabled="disableInputs" type="button" class="btn btn-sm role-link" @click="buttonProps.remove(buttonProps.idx)">
              REMOVE
            </button>
          </template>
          <template v-slot:value="valProps">
            <StringMatch
              :spec="valProps.row.value"
              :options="['exact', 'prefix', 'regexp']"
              placeholder="e.g. bar"
              @input="e=>{
                valProps.row.value = e
                valProps.queueUpdate()
              }"
            />
          </template>
        </KeyValue>
      </div>

      <div class="col span-6">
        <h5>Cookies</h5>
        <KeyValue
          v-model="cookies"
          key-name="name"
          :as-map="false"
          add-label="Add Cookie Rule"
          :protip="false"
          :pad-left="false"
          :read-allowed="false"
        >
          <template v-slot:removeButton="buttonProps">
            <button :disabled="disableInputs" type="button" class="btn btn-sm role-link" @click="buttonProps.remove(buttonProps.idx)">
              REMOVE
            </button>
          </template>
          <template v-slot:value="valProps">
            <StringMatch
              :spec="valProps.row.value"
              :options="['exact', 'prefix']"
              placeholder="e.g. bar"
              @input="e=>{
                valProps.row.value = e
                valProps.queueUpdate()
              }"
            />
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
  .match {
    & .fixed  tr {
      & .key, .value, .remove {
        vertical-align: middle;
      }
      & .remove {
        text-align:left;
        & button.role-link {
          padding: 0 0 0 0;
        }
      }
      & td {
        margin-right: 5px;
        & .labeled-input {
          padding: 0;
          & label:nth-child(1) {
            bottom: -2px;
          }
        }
      }
    }
  }
</style>
