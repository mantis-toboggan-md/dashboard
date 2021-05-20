import EmberPage from '@/components/EmberPage';
import { MANAGEMENT } from '@/config/types';
import { haveV1Monitoring } from '@/utils/monitoring';

export default {
  components: { EmberPage },

  data() {
    const { namespace, resource, id } = this.$route.params;
    const projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);
    const p = projects.find((p) => {
      return !!p.namespaces.find((ns) => {
        return ns.metadata.name === namespace;
      });
    });

    let v1MonitoringUrl = null;

    if (p && haveV1Monitoring(this.$store.getters)) {
      const prjID = p.id.replace('/', ':');
      let prefix = 'workloads/';

      if (resource !== 'pod') {
        const r = resource.split('.');
        const res = r.length === 2 ? r[1] : r[0];

        prefix = `workload-metrics/${ res }:`;
      } else {
        prefix = `workloads/pod-metrics/`;
      }

      v1MonitoringUrl = `/p/${ prjID }/${ prefix }${ namespace }:${ id }`;
    }

    return {
      project: p ? p.id : null,
      v1MonitoringUrl,
    };
  },
};
