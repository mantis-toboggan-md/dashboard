<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { CHART_NAME } from '../config/constants';

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <div class="not-installed">
    <div class="not-installed__content">
      <i class="icon icon-warning not-installed__icon" />

      <h1>{{ t('kubecost.notInstalled.title') }}</h1>
      <p>{{ t('kubecost.notInstalled.description') }}</p>

      <div class="not-installed__steps">
        <h3>{{ t('kubecost.notInstalled.stepsTitle') }}</h3>
        <ol>
          <li>
            <strong>{{ t('kubecost.notInstalled.step1.title', { chart: CHART_NAME }) }}</strong>
            <p>{{ t('kubecost.notInstalled.step1.description') }}</p>
            <code class="install-cmd">helm install cost-analyzer kubecost/cost-analyzer --namespace kubecost --create-namespace</code>
          </li>
          <li>
            <strong>{{ t('kubecost.notInstalled.step2.title') }}</strong>
            <p>{{ t('kubecost.notInstalled.step2.description') }}</p>
            <code class="install-cmd">kubectl port-forward --namespace kubecost deployment/kubecost-cost-analyzer 9090</code>
          </li>
        </ol>
      </div>

      <InstallHelmCharts :charts="[{ chartName: CHART_NAME }]" />

      <div class="not-installed__docs">
        <a
          href="https://www.ibm.com/docs/en/kubecost/self-hosted/3.x?topic=installation"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('kubecost.notInstalled.installDocs') }}
          <i class="icon icon-external-link" />
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-installed {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;

  &__content {
    max-width: 600px;
    text-align: center;
    padding: 24px;
  }

  &__icon {
    font-size: 4rem;
    color: var(--warning);
    margin-bottom: 20px;
  }

  p {
    margin: 12px 0;
    color: var(--input-label);
  }

  &__steps {
    text-align: left;
    margin: 24px 0;
    background: var(--box-bg);
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 20px 24px;

    h3 {
      margin-bottom: 16px;
    }

    ol {
      padding-left: 20px;

      li {
        margin-bottom: 20px;

        strong {
          display: block;
          margin-bottom: 4px;
        }

        p {
          margin: 4px 0 8px;
          font-size: 0.9rem;
        }
      }
    }
  }

  &__docs {
    margin-top: 20px;

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
}

.install-cmd {
  display: block;
  background: var(--code-bg, #1e1e1e);
  color: var(--code-color, #d4d4d4);
  padding: 8px 12px;
  border-radius: var(--border-radius);
  font-family: monospace;
  font-size: 0.85rem;
  overflow-x: auto;
  white-space: nowrap;
}
</style>
