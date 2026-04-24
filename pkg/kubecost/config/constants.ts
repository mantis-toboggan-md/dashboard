/**
 * Helm chart constants for the kubecost/cost-analyzer chart (v2.9.6).
 *
 * The chart provides one CRD:
 *   TurndownSchedule  (group: kubecost.com, plural: turndownschedules)
 *   Used to schedule cluster scale-down events to reduce cloud spend.
 */

/** Kubernetes type string for the TurndownSchedule CRD */
export const TURNDOWN_SCHEDULE = 'kubecost.com.turndownschedule';

/** Primary CRD used to detect whether the cost-analyzer chart is installed */
export const DETECTION_TYPE = TURNDOWN_SCHEDULE;

/** Helm chart name used to install the cost analyzer */
export const CHART_NAME = 'cost-analyzer';

/** Namespace where Kubecost is deployed (default) */
export const CHART_NAMESPACE = 'kubecost';

/** Kubecost product name (used as the nav product identifier) */
export const PRODUCT_NAME = 'kubecost';

/** Overview virtual-type page name */
export const OVERVIEW_PAGE_NAME = 'overview';

/**
 * Path suffix for reaching the Kubecost UI via the Kubernetes service proxy.
 * Full URL: /k8s/clusters/<id>/api/v1/namespaces/kubecost/services/http:kubecost-cost-analyzer:9090/proxy/
 */
export const KUBECOST_SERVICE_NAME = 'kubecost-cost-analyzer';
export const KUBECOST_SERVICE_PORT = 9090;

/** Kubecost REST API paths (relative to service proxy root) */
export const KUBECOST_API = {
  ALLOCATION: '/model/allocation',
  ASSETS:     '/model/assets',
  SAVINGS:    '/model/savings',
  CLUSTER:    '/model/clusterInfo',
} as const;
