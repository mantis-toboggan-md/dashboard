<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import NotInstalled from './NotInstalled.vue';
import {
  DETECTION_TYPE,
  TURNDOWN_SCHEDULE,
  CHART_NAMESPACE,
  KUBECOST_SERVICE_NAME,
  KUBECOST_SERVICE_PORT,
  KUBECOST_API,
} from '../config/constants';

const store = useStore();
const { t } = useI18n(store);

// ── Install detection ────────────────────────────────────────────────────────
const isInstalled = computed(() => {
  return !!store.getters['cluster/schemaFor'](DETECTION_TYPE);
});

// ── TurndownSchedule resources ────────────────────────────────────────────────
const turndownSchedules = computed(() => {
  return (store.getters['cluster/all'](TURNDOWN_SCHEDULE) as any[]) ?? [];
});

// ── Kubecost REST API data (fetched via Kubernetes service proxy) ─────────────
interface AllocationItem {
  name: string;
  cpuCost: number;
  gpuCost: number;
  ramCost: number;
  pvCost: number;
  networkCost: number;
  sharedCost: number;
  externalCost: number;
  totalCost: number;
  cpuEfficiency: number;
  ramEfficiency: number;
  totalEfficiency: number;
}

interface ClusterInfo {
  id?: string;
  name?: string;
  address?: string;
  profile?: string;
  provider?: string;
  account?: string;
  region?: string;
  providerID?: string;
}

const allocationData = ref<AllocationItem[]>([]);
const clusterInfo = ref<ClusterInfo>({});
const totalCost = ref<number | null>(null);
const costWindow = ref('1d');
const loading = ref(false);
const apiError = ref<string | null>(null);

/**
 * Build the Kubernetes service proxy URL for the Kubecost REST API.
 * This routes through the Rancher API proxy so no direct network access to
 * the Kubecost pod is required from the browser.
 */
function buildProxyUrl(path: string, params: Record<string, string> = {}): string {
  const cluster = store.getters['currentCluster'];
  const clusterId: string = cluster?.id ?? 'local';
  const base = `/k8s/clusters/${ clusterId }/api/v1/namespaces/${ CHART_NAMESPACE }/services/http:${ KUBECOST_SERVICE_NAME }:${ KUBECOST_SERVICE_PORT }/proxy${ path }`;
  const qs = new URLSearchParams(params).toString();

  return qs ? `${ base }?${ qs }` : base;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' });

  if (!res.ok) {
    throw new Error(`${ res.status } ${ res.statusText }`);
  }

  return res.json() as Promise<T>;
}

async function loadCostData(): Promise<void> {
  loading.value = true;
  apiError.value = null;

  try {
    // Fetch namespace-level allocation for the selected window
    const allocationUrl = buildProxyUrl(KUBECOST_API.ALLOCATION, {
      window:      costWindow.value,
      aggregate:   'namespace',
      accumulate:  'true',
      includeIdle: 'false',
    });

    const allocationRes = await fetchJson<{ data: Record<string, AllocationItem>[] }>(allocationUrl);

    if (allocationRes?.data?.length) {
      const set = allocationRes.data[0];

      allocationData.value = Object.values(set).sort((a, b) => b.totalCost - a.totalCost);
      totalCost.value = allocationData.value.reduce((sum, item) => sum + item.totalCost, 0);
    }

    // Fetch cluster info for debug details
    const clusterUrl = buildProxyUrl(KUBECOST_API.CLUSTER);

    clusterInfo.value = await fetchJson<ClusterInfo>(clusterUrl);
  } catch (e: any) {
    apiError.value = e?.message ?? String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (isInstalled.value) {
    loadCostData();
  }
});

// ── Summary cards ─────────────────────────────────────────────────────────────
const summaryCards = computed(() => [
  {
    labelKey: 'kubecost.overview.cards.totalCost',
    value:    totalCost.value !== null ? `$${ totalCost.value.toFixed(2) }` : '—',
    icon:     'icon-dollar',
  },
  {
    labelKey: 'kubecost.overview.cards.namespaces',
    value:    String(allocationData.value.length),
    icon:     'icon-folder',
  },
  {
    labelKey: 'kubecost.overview.cards.turndownSchedules',
    value:    String(turndownSchedules.value.length),
    icon:     'icon-clock',
  },
]);

// ── Formatting helpers ────────────────────────────────────────────────────────
function formatCost(v: number): string {
  return `$${ v.toFixed(4) }`;
}

function formatPct(v: number): string {
  return `${ (v * 100).toFixed(1) }%`;
}

const windowOptions = [
  { value: '1d', label: 'Last 1 day' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'lastmonth', label: 'Last month' },
];

function onWindowChange(): void {
  loadCostData();
}
</script>

<template>
  <div class="kubecost-overview">
    <!-- Not installed splash -->
    <NotInstalled v-if="!isInstalled" />

    <template v-else>
      <div class="kubecost-overview__header">
        <h1>{{ t('kubecost.overview.title') }}</h1>

        <!-- Cluster info badge -->
        <span
          v-if="clusterInfo.provider"
          class="cluster-badge"
        >
          {{ clusterInfo.provider }}
          <template v-if="clusterInfo.region"> / {{ clusterInfo.region }}</template>
        </span>
      </div>

      <!-- API error banner -->
      <div
        v-if="apiError"
        class="api-error-banner"
      >
        <i class="icon icon-warning" />
        {{ t('kubecost.overview.apiError', { message: apiError }) }}
        <button
          class="btn btn-sm role-primary ml-10"
          @click="loadCostData"
        >
          {{ t('generic.reload') }}
        </button>
      </div>

      <!-- Window selector -->
      <div class="window-selector">
        <label class="window-selector__label">{{ t('kubecost.overview.window') }}</label>
        <select
          v-model="costWindow"
          class="window-selector__select"
          @change="onWindowChange"
        >
          <option
            v-for="opt in windowOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Summary cards -->
      <div class="summary-cards">
        <div
          v-for="card in summaryCards"
          :key="card.labelKey"
          class="summary-card"
        >
          <i :class="`icon ${ card.icon }`" />
          <div class="summary-card__value">
            {{ card.value }}
          </div>
          <div class="summary-card__label">
            {{ t(card.labelKey) }}
          </div>
        </div>
      </div>

      <!-- Cost allocation table -->
      <div class="section">
        <div class="section__header">
          <h3>{{ t('kubecost.overview.allocation.title') }}</h3>
          <span
            v-if="loading"
            class="loading-spinner"
          >
            <i class="icon icon-spinner icon-spin" />
          </span>
        </div>

        <table
          v-if="allocationData.length"
          class="sortable-table"
        >
          <thead>
            <tr>
              <th>{{ t('kubecost.overview.allocation.namespace') }}</th>
              <th>{{ t('kubecost.overview.allocation.cpuCost') }}</th>
              <th>{{ t('kubecost.overview.allocation.ramCost') }}</th>
              <th>{{ t('kubecost.overview.allocation.pvCost') }}</th>
              <th>{{ t('kubecost.overview.allocation.networkCost') }}</th>
              <th>{{ t('kubecost.overview.allocation.totalCost') }}</th>
              <th>{{ t('kubecost.overview.allocation.efficiency') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in allocationData"
              :key="item.name"
            >
              <td>{{ item.name }}</td>
              <td>{{ formatCost(item.cpuCost) }}</td>
              <td>{{ formatCost(item.ramCost) }}</td>
              <td>{{ formatCost(item.pvCost) }}</td>
              <td>{{ formatCost(item.networkCost) }}</td>
              <td><strong>{{ formatCost(item.totalCost) }}</strong></td>
              <td>{{ formatPct(item.totalEfficiency) }}</td>
            </tr>
          </tbody>
        </table>

        <div
          v-else-if="!loading && !apiError"
          class="no-data"
        >
          {{ t('kubecost.overview.allocation.noData') }}
        </div>
      </div>

      <!-- TurndownSchedule list -->
      <div class="section">
        <h3>{{ t('kubecost.overview.turndown.title') }}</h3>
        <p class="section__desc">
          {{ t('kubecost.overview.turndown.description') }}
        </p>

        <table
          v-if="turndownSchedules.length"
          class="sortable-table"
        >
          <thead>
            <tr>
              <th>{{ t('tableHeaders.name') }}</th>
              <th>{{ t('kubecost.overview.turndown.schedule') }}</th>
              <th>{{ t('kubecost.overview.turndown.scaleDownTime') }}</th>
              <th>{{ t('kubecost.overview.turndown.scaleUpTime') }}</th>
              <th>{{ t('tableHeaders.state') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="td in turndownSchedules"
              :key="td.id"
            >
              <td>{{ td.name }}</td>
              <td>{{ td.spec?.schedule || '—' }}</td>
              <td>{{ td.spec?.scaleDownTime || '—' }}</td>
              <td>{{ td.spec?.scaleUpTime || '—' }}</td>
              <td>{{ td.status?.state || '—' }}</td>
            </tr>
          </tbody>
        </table>

        <div
          v-else
          class="no-data"
        >
          {{ t('kubecost.overview.turndown.noSchedules') }}
        </div>
      </div>

      <!-- Debug: Cluster info -->
      <div class="section">
        <h3>{{ t('kubecost.overview.debug.title') }}</h3>
        <table
          v-if="clusterInfo.id || clusterInfo.name"
          class="sortable-table"
        >
          <tbody>
            <tr
              v-for="(val, key) in clusterInfo"
              :key="key"
            >
              <td class="key-cell">
                {{ key }}
              </td>
              <td>{{ val || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div
          v-else-if="!loading && !apiError"
          class="no-data"
        >
          {{ t('kubecost.overview.debug.noData') }}
        </div>
      </div>

      <!-- Docs link -->
      <div class="docs-link">
        <a
          href="https://www.ibm.com/docs/en/kubecost/self-hosted/3.x"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('kubecost.overview.docsLink') }}
          <i class="icon icon-external-link" />
        </a>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.kubecost-overview {
  padding: 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
}

.cluster-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  background: var(--primary);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
}

.api-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--error-banner-bg, #fdf0f0);
  border: 1px solid var(--error);
  border-radius: var(--border-radius);
  padding: 10px 16px;
  margin-bottom: 20px;
  color: var(--error);

  .icon {
    font-size: 1.2rem;
  }
}

.window-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;

  &__label {
    font-weight: 600;
    color: var(--input-label);
  }

  &__select {
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background: var(--input-bg);
    color: var(--body-text);
  }
}

.summary-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 32px;

  .summary-card {
    background: var(--body-bg);
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 16px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 160px;

    .icon {
      font-size: 2rem;
      margin-bottom: 8px;
      color: var(--primary);
    }

    &__value {
      font-size: 1.8rem;
      font-weight: bold;
      line-height: 1;
    }

    &__label {
      font-size: 0.8rem;
      color: var(--input-label);
      margin-top: 6px;
      text-align: center;
    }
  }
}

.section {
  margin-bottom: 36px;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    h3 {
      margin: 0;
    }
  }

  &__desc {
    color: var(--input-label);
    font-size: 0.9rem;
    margin-bottom: 12px;
  }

  h3 {
    margin-bottom: 12px;
  }
}

.key-cell {
  font-weight: 600;
  color: var(--input-label);
  min-width: 180px;
}

.no-data {
  color: var(--input-label);
  font-style: italic;
  padding: 12px 0;
}

.loading-spinner {
  color: var(--primary);
}

.docs-link {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--border);

  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
