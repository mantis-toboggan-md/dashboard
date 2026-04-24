import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { PRODUCT_NAME, OVERVIEW_PAGE_NAME, TURNDOWN_SCHEDULE } from './config/constants';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  /**
   * Register Kubecost as a new top-level product in the Cluster Explorer.
   *
   * The cost-analyzer chart (v2.9.6) ships one CRD:
   *   kubecost.com.turndownschedule  — schedule cluster scale-down to reduce cloud spend
   *
   * The Overview page surfaces:
   *   • Kubecost cost allocation summary (namespace breakdown, 1d window)
   *   • Cluster cost info
   *   • TurndownSchedule count and list
   *   • Quick-debug info (pod status, config)
   */
  plugin.addProduct(
    {
      name:       PRODUCT_NAME,
      label:      'Kubecost',
      icon:       'dollar',
      inExplorer: true,
      weight:     88,
    },
    [
      // ── Overview custom page ───────────────────────────────────────────────
      {
        name:      OVERVIEW_PAGE_NAME,
        labelKey:  'kubecost.overview.label',
        component: () => import('./pages/Overview.vue'),
      },

      // ── Monitor group (maps to the Kubecost UI Monitor section) ───────────
      {
        name:     'monitor',
        labelKey: 'kubecost.nav.monitor',
        children: [
          // TurndownSchedule CRD — the only CRD provided by the chart
          { type: TURNDOWN_SCHEDULE },
        ],
      },
    ]
  );
}
