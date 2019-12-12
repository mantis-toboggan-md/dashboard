
<script>
import { mapMutations } from 'vuex';
import { RIO } from '../../config/types';
import Match from '@/edit/rio.cattle.io.v1.router/Match';
import Destination from '@/edit/rio.cattle.io.v1.router/Destination';
import Redirect from '@/edit/rio.cattle.io.v1.router/Redirect';
import Headers from '@/edit/rio.cattle.io.v1.router/Headers';
import Fault from '@/edit/rio.cattle.io.v1.router/Fault';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: {
    Match,
    Destination,
    Redirect,
    Headers,
    Fault,
    Checkbox
  },
  props:      {
    id: {
      type:     String,
      required: true
    },
    position: {
      type:     Number,
      required: true
    },
  },

  inject:   { disableInputs: { default: false } },

  computed: {
    destinations() {
      return this.$store.state.friendly[RIO.ROUTER].destinations[this.id];
    },
    redirect() {
      return this.$store.state.friendly[RIO.ROUTER].redirects[this.id];
    },
    headers() {
      return this.$store.state.friendly[RIO.ROUTER].headers[this.id];
    },
    mirror() {
      return this.$store.state.friendly[RIO.ROUTER].mirrors[this.id];
    },
    fault() {
      return this.$store.state.friendly[RIO.ROUTER].faults[this.id];
    },
    shouldFault() {
      return this.$store.state.friendly[RIO.ROUTER].shouldFault[this.id];
    },
    shouldMirror() {
      return this.$store.state.friendly[RIO.ROUTER].shouldMirror[this.id];
    },
    shouldRedirect() {
      return this.$store.state.friendly[RIO.ROUTER].shouldRedirect[this.id];
    }
  },
  methods:  {
    ...mapMutations(`friendly/${ RIO.ROUTER }`,
      ['repositionRoute',
        'updateDestination',
        'updateRedirect',
        'updateHeaders',
        'toggleRedirect',
        'toggleFault',
        'toggleMirror',
        'updateMirror',
        'updateFault'
      ])
  }
};
</script>

<template>
  <div class="route">
    <div class="section">
      <div class="header">
        <h4>
          Match
        </h4>
        <div class="position-mover">
          {{ position + 1 }}
          <div class="position-inputs">
            <button type="button" class="btn bg-transparent icon-btn icon icon-sort-up" @click="repositionRoute({position, direction:'up'})">
              {{ '' }}
            </button>
            <button type="button" class="btn bg-transparent icon-btn icon icon-sort-down" @click="repositionRoute({position, direction:'down'})">
              {{ '' }}
            </button>
          </div>
        </div>
        <button :disabled="disableInputs" type="button" class="btn role-link" @click="repositionRoute({position, direction:'delete'})">
          REMOVE
        </button>
      </div>
      <div class="row">
        <Match
          class="col span-12"
          :route-i-d="id"
        />
      </div>
    </div>
    <div class="destination section">
      <div class="row">
        <h4>Destination</h4>
      </div>
      <div class="row">
        <div class="col span-12">
          <label class="radio">
            <input :checked="!shouldRedirect" :disabled="disableInputs" type="radio" @click="e=>toggleRedirect({id})">
            Forward to a Service
          </label>

          <label class="radio">
            <input :disabled="disableInputs" type="radio" :checked="shouldRedirect" @click="e=>toggleRedirect({id})">
            HTTP Redirect
          </label>
        </div>
      </div>
      <div class="row">
        <template v-if="!shouldRedirect">
          <table class="inputs-table">
            <tr>
              <th class="input-col">
                App
              </th>
              <th class="input-col">
                Version
              </th>
              <th class="input-col sm">
                Port
              </th>
              <th v-if="destinations.length>1" class="input-col sm">
                Weight
              </th>
              <th class="input-col sm">
              </th>
            </tr>
            <Destination
              v-for="(destination, i) in destinations"
              :key="i"
              :is-weighted="destinations.length>1"
              :spec="destination"
              :can-remove="destinations.length>1"
              @input="destination=>updateDestination({id, destination, i})"
            />
          </table>
        </template>
      </div>
      <div v-if="!shouldRedirect" class="row">
        <button :disabled="disableInputs" type="button" class="btn btn-sm bg-primary " @click="updateDestination({id, destination:{}})">
          + Add Destination
        </button>
      </div>
      <div v-if="shouldRedirect" class="row">
        <Redirect class="col span-12" :spec="redirect" @input="redirect=>updateRedirect({id, redirect})" />
      </div>
    </div>

    <div v-if="!shouldRedirect" class="header section">
      <div class="row">
        <h4 class="col span-12">
          Rewrite Request Headers
        </h4>
      </div>
      <div class="row">
        <Headers
          class="col span-12"
          :enabled="!shouldRedirect"
          :spec="headers"
          @input="headers=>updateHeaders({id, headers})"
        />
      </div>
    </div>

    <div class="row">
      <Checkbox :value="shouldMirror" type="checkbox" label="Mirror" @input="toggleMirror({id})" />

      <Checkbox :value="shouldFault" type="checkbox" label="Fault" @input="toggleFault({id})" />
    </div>

    <div v-if="shouldMirror" class="row">
      <div class="col span-12">
        <table class="inputs-table">
          <Destination
            show-placeholders
            :pick-version="false"
            :spec="mirror"
            :is-weighted="false"
            @input="mirror=>updateMirror({id, mirror})"
          />
        </table>
      </div>
    </div>

    <div class="row">
      <div v-if="shouldFault" class="col span-12">
        <Fault :spec="fault" @input="fault=>updateFault({id, fault})" />
      </div>
    </div>
  </div>
</template>

<style  lang='scss'>
  .route {
    margin-top: 20px;
    padding: 20px;
    background-color: var(--login-bg);
    margin-bottom: 20px;
    border-radius: 3px;

    & .inputs-table {
      margin: 10px 0 10px 0;
      table-layout:fixed;

      & th {
        text-align: left;
        padding-bottom: 10px;
        color: var(--input-label);
        font-weight: normal;
      }
      & td {
        padding: 0  10px 10px 0;
        vertical-align:middle;
        & > * {
          height: 4em;
        }
      }
      & td.sm{
        width:100px;
      }
      & td:not(.sm) {
        width: 200px;
      }
    }

    & .header{
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;

      & H4 {
        flex-grow: 2;
      }

      & .position-mover {
        display: flex;
        align-items: center;
        padding: 10px 15px;
        background-color: var(--input-bg);
        border-radius: var(--border-radius);
        & > .position-inputs {
          margin-left: 10px;
          display: flex;
          flex-direction: column;
          position:relative;
          & button {
            height: 10px;
            font-size: 10px;
          }
          & button:focus {
            box-shadow: none;
          }
        }
      }
    }
  }

  .section {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border);

  }
    .row.inputs > *:not(button) {
      margin-right: 10px;
      flex: 1;
      & .vs__dropdown-toggle {
        height: 100%
      }
    }
</style>
