import { RBAC } from '@/config/types';
export default {
  findRole() {
    return (store) => {
      console.log('finding role for: ', this);
      const type = this.roleRef.kind === 'ClusterRole' ? RBAC.CLUSTER_ROLE : RBAC.ROLE;
      const roleID = type === RBAC.ROLE ? `${ this.metadata.namespace }/${ this.roleRef.name }` : this.roleRef.name;

      return store.dispatch('cluster/find', { type, id: roleID });
    };
  }
};
