/**
 * Constants for the kubecost/cost-analyzer Helm chart (v2.9.6).
 *
 * Chart source:
 *   https://github.com/rancher/partner-charts/tree/main-source/charts/kubecost/cost-analyzer/2.9.6
 *
 * The chart ships one CRD:
 *   TurndownSchedule  (group: kubecost.com, plural: turndownschedules)
 *   Used to schedule cluster scale-down events to reduce cloud spend during
 *   off-hours. Managed by the kubecost turndown controller.
 */

/** Kubernetes type string for the TurndownSchedule CRD */
export const TURNDOWN_SCHEDULE = 'kubecost.com.turndownschedule';

/** Used to detect whether the cost-analyzer chart is installed */
export const DETECTION_TYPE = TURNDOWN_SCHEDULE;

/** Helm chart name as it appears in the Rancher Apps catalog */
export const CHART_NAME = 'cost-analyzer';

/** Helm repo/vendor name */
export const CHART_VENDOR = 'kubecost';

/** Default namespace for the Kubecost deployment */
export const CHART_NAMESPACE = 'kubecost';

/** Kubernetes service name for the cost-analyzer pod */
export const KUBECOST_SERVICE_NAME = 'cost-analyzer';

/** Port exposed by the cost-analyzer service */
export const KUBECOST_SERVICE_PORT = 9090;

/**
 * Kubecost REST API path segments (appended to the Kubernetes service proxy base URL).
 * Full IBM Kubecost API reference:
 *   https://www.ibm.com/docs/en/kubecost/self-hosted/3.x?topic=kubecost-api-directory
 */
export const KUBECOST_API = {
  /** Allocation API — cost by namespace/label/deployment etc. */
  ALLOCATION: '/model/allocation',
  /** Assets API — cost by node, disk, etc. */
  ASSETS:     '/model/assets',
  /** Savings API — cluster-level savings estimates */
  SAVINGS:    '/model/savings',
  /** Cluster info — provider, region, ID */
  CLUSTER:    '/model/clusterInfo',
} as const;

/** Overview page name (virtual type identifier) */
export const OVERVIEW_PAGE_NAME = 'kubecost-overview';
