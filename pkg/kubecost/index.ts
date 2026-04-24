import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { StandardProductNames } from '@shell/core/plugin-types';
import {
  OVERVIEW_PAGE_NAME,
  TURNDOWN_SCHEDULE,
} from './config/constants';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  /**
   * Add a "Kubecost" group to the Cluster Explorer.
   *
   * The cost-analyzer chart (v2.9.6) provides one CRD:
   *   kubecost.com.turndownschedule  — schedule cluster scale-down to cut cloud spend
   *
   * IBM Kubecost UI sections mapped to nav children:
   *   Overview     — cost summary, allocation table, cluster info (custom page)
   *   Monitor      — Turndown Schedules (the only k8s CRD from this chart)
   */
  plugin.extendProduct(StandardProductNames.EXPLORER, [
    {
      name:      'kubecost',
      labelKey:  'kubecost.nav.group',
      component: () => import('./pages/Overview.vue'),
      children:  [
        // ── Overview custom page ─────────────────────────────────────────────
        {
          name:      OVERVIEW_PAGE_NAME,
          labelKey:  'kubecost.overview.label',
          component: () => import('./pages/Overview.vue'),
        },

        // ── Monitor sub-group ────────────────────────────────────────────────
        // Surfaces the one CRD shipped by the chart.
        // Maps to the "Monitor" section of the Kubecost UI:
        //   https://www.ibm.com/docs/en/kubecost/self-hosted/3.x?topic=navigating-kubecost-ui
        {
          name:     'monitor',
          labelKey: 'kubecost.nav.monitor',
          children: [
            { type: TURNDOWN_SCHEDULE },
          ],
        },
      ],
    },
  ]);
}
