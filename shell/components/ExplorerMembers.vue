<script>
import { MANAGEMENT, NORMAN, VIRTUAL_TYPES } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { AGE, ROLE, STATE, PRINCIPAL } from '@shell/config/table-headers';
import { canViewClusterPermissionsEditor } from '@shell/components/form/Members/ClusterPermissionsEditor.vue';
import Banner from '@components/Banner/Banner.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import SortableTable from '@shell/components/SortableTable';
import { mapGetters } from 'vuex';
import { canViewProjectMembershipEditor } from '~/shell/components/form/Members/ProjectMembershipEditor.vue';
import { allHash } from '@shell/utils/promise';

/**
 * Explorer members page.
 * Route: /c/local/explorer/members
 */
export default {
  name: 'ExplorerMembers',

  components: {
    Banner,
    Masthead,
    ResourceTable,
    Tabbed,
    Tab,
    SortableTable
  },

  props: {
    // Cluster tole template binding create route - defaults to the explorer route
    createLocationOverride: {
      type:    Object,
      default: () => {
        return {
          name:   'c-cluster-product-resource-create',
          params: { resource: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING }
        };
      }
    }
  },

  async fetch() {
    const clusterRoleTemplateBindingSchema = this.$store.getters[
      `rancher/schemaFor`
    ](NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING);

    const projectRoleTemplateBindingSchema = this.$store.getters['rancher/schemaFor'](NORMAN.PROJECT_ROLE_TEMPLATE_BINDING);
    const projectSchema = this.$store.getters[`management/schemaFor`](MANAGEMENT.PROJECT);
    const roleTemplateSchema = this.$store.getters[`management/schemaFor`](MANAGEMENT.ROLE_TEMPLATE);

    const hydration = {
      clusterRoleTemplateBindings: clusterRoleTemplateBindingSchema ? this.$store.dispatch(
        `rancher/findAll`,
        { type: NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING },
        { root: true }
      ) : [],
      projectRoleTemplateBindings:     projectRoleTemplateBindingSchema ? this.$store.dispatch('rancher/findAll', { type: NORMAN.PROJECT_ROLE_TEMPLATE_BINDING }, { root: true }) : [],
      mgmtClusterRoleTemplateBindings: clusterRoleTemplateBindingSchema ? this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING }) : [],
      projects:                        projectSchema ? this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT }) : [],
      roleTemplates:                   roleTemplateSchema ? this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE }) : [],
      normanPrincipals:                this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL }),
      mgmt:                            this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER }),
      mgmtRoleTemplates:               this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }),
    };
    const { clusterRoleTemplateBindings, projectRoleTemplateBindings, projects } = await allHash(hydration);

    const steveBindings = await Promise.all(
      clusterRoleTemplateBindings.map(b => b.steve)
    );

    this.$set(this, 'projectRoleTemplateBindings', projectRoleTemplateBindings);
    this.$set(this, 'projects', projects);
    this.$set(this, 'normanClusterRTBSchema', clusterRoleTemplateBindingSchema);
    this.$set(this, 'normanProjectRTBSchema', projectRoleTemplateBindingSchema);
    this.$set(this, 'clusterRoleTemplateBindings', steveBindings);
  },

  data() {
    return {
      schema: this.$store.getters[`management/schemaFor`](
        MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING
      ),
      headers:        [STATE, PRINCIPAL, ROLE, AGE],
      createLocation: {
        ...this.createLocationOverride,
        params: {
          ...this.createLocationOverride.params,
          cluster: this.$store.getters['currentCluster'].id
        }
      },
      resource:                         MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      normanClusterRTBSchema:      null,
      normanProjectRTBSchema:      null,
      clusterRoleTemplateBindings:      [],
      projectRoleTemplateBindings:      [],
      projects:                         [],
      VIRTUAL_TYPES,
      projectRoleTemplateColumns:       [
        STATE,
        {
          name:      'member',
          labeKey:     'generic.name',
          value:     'principalId',
          formatter: 'Principal'
        },
        {
          name:     'role',
          labelKey: 'tableHeaders.role',
          value:    'roleTemplate.nameDisplay'
        },
        { ...AGE, value: 'createdTS' }
      ]
    };
  },

  computed: {
    clusterRoleTemplateBindings() {
      return this.$store.getters[`rancher/all`](NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING).map(b => b.clusterroletemplatebinding) ;
    },
    ...mapGetters(['currentCluster']),
    filteredClusterRoleTemplateBindings() {
      return this.clusterRoleTemplateBindings.filter(
        b => b?.clusterName === this.$store.getters['currentCluster'].id
      );
    },
    filteredProjects() {
      return this.projects.reduce((all, p) => {
        if (p?.spec?.clusterName === this.currentCluster.id) {
          all[p.id] = p;
        }

        return all;
      }, {});
    },
    filteredProjectRoleTemplateBindings() {
      const out = this.projectRoleTemplateBindings.filter((rb) => {
        const projectId = rb.projectId.replace(':', '/');

        return !!this.filteredProjects[projectId];
      });

      return out;
    },
    canManageMembers() {
      return canViewClusterPermissionsEditor(this.$store);
    },
    canManageProjectMembers() {
      return canViewProjectMembershipEditor(this.$store);
    },
    isLocal() {
      return this.$store.getters['currentCluster'].isLocal;
    },
    canEditProjectMembers() {
      return this.normanProjectRTBSchema?.collectionMethods.find(x => x.toLowerCase() === 'post');
    },
    canEditClusterMembers() {
      return this.normanClusterRTBSchema?.collectionMethods.find(x => x.toLowerCase() === 'post');
    }

  },
  methods: {
    getMgmtProjectId(group) {
      return group.group.key.replace(':', '/');
    },
    getMgmtProject(group) {
      return this.$store.getters['management/byId'](MANAGEMENT.PROJECT, this.getMgmtProjectId(group));
    },
    getProjectLabel(group) {
      return this.getMgmtProject(group)?.spec?.displayName;
    },
    addProjectMember(group) {
      this.$store.dispatch('cluster/promptModal', {
        component:      'AddProjectMemberDialog',
        componentProps: {
          projectId:   group.group.key,
          saveInModal: true
        },
        modalSticky: true
      });
    },
  }
};
</script>

<template>
  <div class="project-members">
    <Masthead
      :schema="schema"
      :resource="resource"
      :favorite-resource="VIRTUAL_TYPES.CLUSTER_MEMBERS"
      :create-location="createLocation"
      :create-button-label="t('members.createActionLabel')"
      :is-creatable="false"
      :type-display="t('members.clusterAndProject')"
    />
    <Banner
      v-if="isLocal"
      color="error"
      :label="t('members.localClusterWarning')"
    />
    <Tabbed>
      <Tab
        name="cluster-membership"
        label="Cluster Membership"
      >
        <div
          v-if="canEditClusterMembers"
          class="row mb-10 cluster-add"
        >
          <n-link
            :to="createLocation"
            class="btn role-primary pull-right"
          >
            {{ t('members.createActionLabel') }}
          </n-link>
        </div>
        <ResourceTable
          :schema="schema"
          :headers="headers"
          :rows="filteredClusterRoleTemplateBindings"
          :groupable="false"
          :namespaced="false"
          :loading="$fetchState.pending || !currentCluster"
          sub-search="subSearch"
          :sub-fields="['nameDisplay']"
        />
      </Tab>
      <Tab
        v-if="canManageProjectMembers"
        name="project-membership"
        label="Project Membership"
      >
        <SortableTable
          group-by="projectId"
          :loading="$fetchState.pending || !currentCluster"
          :rows="filteredProjectRoleTemplateBindings"
          :headers="projectRoleTemplateColumns"
        >
          <template #group-by="group">
            <div class="group-bar">
              <div
                v-trim-whitespace
                class="group-tab"
              >
                <div
                  class="project-name"
                  v-html="getProjectLabel(group)"
                />
                <div class="description text-muted text-small" />
              </div>
              <div class="right">
                <button
                  v-if="canEditProjectMembers"
                  type="button"
                  class="create-namespace btn btn-sm role-secondary mr-5 right"
                  @click="addProjectMember(group)"
                >
                  {{ t('members.createActionLabel') }}
                </button>
              </div>
            </div>
          </template>
        </SortableTable>
      </Tab>
    </Tabbed>
  </div>
</template>

<style lang='scss' scoped>
.project-members {
  & ::v-deep .group-bar{
    display: flex;
    justify-content: space-between;
  }
}
.cluster-add {
  justify-content: flex-end;
}
</style>
