<script>
import { mapActions } from 'vuex';
import { RBAC } from '../config/types';
import { NAME, CREATED } from '../config/table-headers';
import loadDeps from '@/mixins/load-deps';
import { get } from '@/utils/object';
import ResourceTable from '@/components/ResourceTable';
export default {
  components: { ResourceTable },
  mixins:     [loadDeps],
  props:      {
    value: {
      type:     Object,
      required: true,
    }
  },
  data() {
    return {
      roleBindings: [],
      groups:       [],
      clusters:     [],
      namespaces:   [],
      roleSchema:   {},
      roles:        []
    };
  },
  computed: {
    name() {
      return get(this.value, 'username');
    },
    displayName() {
      return get(this.value, 'metadata.name');
    },
    userID() {
      return get(this.value, 'id');
    },
    roleBindingHeaders() {
      return [NAME, {
        name:      'granted',
        label:     'Granted',
        sort:       ['created', 'name'],
        search:     false,
        formatter:  'Date',
        value:     'metadata.creationTimestamp',
        align:     'right'
      }];
    }
  },
  methods: {
    loadDeps() {
      this.findRoleBindings();
    },

    async findRoleBindings() {
      const allBindings = await this.findAll({ type: RBAC.ROLE_BINDING });
      const roleBindings = allBindings.filter((roleBinding) => {
        return roleBinding.subjects.filter(subject => subject.name === this.name).length > 0;
      });
      const roleSchmea = await this.$store.getters['cluster/schemaFor'](RBAC.ROLE_BINDING);

      this.roleBindings = roleBindings;
      this.roleSchmea = roleSchmea;
      this.findRoles();
    },

    async findRoles() {
      const roles = this.roleBindings.map(binding => binding.findRole(this.$store));

      this.roles = await Promise.all(roles);
    },

    async findGroups() {
      // TODO find groups which include this user
    },
    ...mapActions('cluster', ['findAll'])
  }
};
</script>

<template>
  <div>
    <div class="detail-top ">
      <div>
        <span>Display Name</span>
        <span>{{ name }}</span>
      </div>
      <div>
        <span>User ID</span>
        <span>{{ userID }}</span>
      </div>
    </div>
    <ResourceTable
      class="flat"
      :rows="roleBindings"
      :schema="roleSchema"
      :headers="roleBindingHeaders"
      :show-groups="false"
    />
  </div>
</template>

<style lang='scss'>
  .detail-top{
    display: flex;
    min-height: 75px;
    & > * {
      margin-right: 20px;
      padding: 10px 0 10px 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;

      &:not(:last-child){
      border-right: 1px solid var(--border);
      }

      & >:not(:first-child){
        color: var(--input-label);
        padding: 3px;
      }
    }
  }
</style>
