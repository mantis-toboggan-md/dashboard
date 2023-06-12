import ClusterManagerCreateRke1PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-custom.po';
import { requestAndLimitsData } from '@/cypress/e2e/tests/pages/data/agent-configuration-rke2-data';
import { tolerationsData, nodeAffinityData, podAffinityData } from '@/cypress/e2e/tests/pages/data/agent-configuration-rke1-data';
import { NodeSelectorTermPo } from '@/cypress/e2e/po/components/embedded-ember/ember-node-affinity.po';

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

// File specific consts
const { baseUrl } = Cypress.config();
// const clusterRequestBase = `${ baseUrl }/v1/provisioning.cattle.io.clusters/fleet-default`;
const clusterNamePartial = `${ runPrefix }-create`;
const rke1CustomName = `${ clusterNamePartial }-rke1-custom`;

describe('rke1-provisioning', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('RKE1 Custom cluster', () => {
    const createClusterPage = new ClusterManagerCreateRke1PagePo();

    it('can create a new cluster', () => {
      createClusterPage.goTo();

      createClusterPage.waitForPage();
      createClusterPage.rkeToggle().unCheck();
      createClusterPage.selectCustom(0);

      createClusterPage.name().set(rke1CustomName);
      createClusterPage.clusterAgentAccordion().expand();

      // // set requests/limits data
      // createClusterPage.clusterAgentConfiguration().cpuRequests().set(requestAndLimitsData.request.cpu.toString());
      // createClusterPage.clusterAgentConfiguration().cpuLimits().set(requestAndLimitsData.limit.cpu.toString());
      // createClusterPage.clusterAgentConfiguration().memoryRequests().set(requestAndLimitsData.request.memory.toString());
      // createClusterPage.clusterAgentConfiguration().memoryLimits().set(requestAndLimitsData.limit.memory.toString());

      // // set tolerations data
      // tolerationsData.forEach((toleration, idx) => {
      //   createClusterPage.clusterAgentConfiguration().tolerations().addRow();
      //   createClusterPage.clusterAgentConfiguration().tolerations().editToleration(toleration, idx);
      // });

      // flip affinity radio
      createClusterPage.clusterAgentConfiguration().affinityRadio().clickLabel('Customize affinity rules');
      // remove node affinity defaults
      createClusterPage.clusterAgentConfiguration().nodeAffinity().removeAllTerms();

      // nodeAffinityData.forEach((nodeSelectorTermData, i) => {
      //   createClusterPage.clusterAgentConfiguration().nodeAffinity().addTerm();
      //   createClusterPage.clusterAgentConfiguration().nodeAffinity().editTerm(nodeSelectorTermData, i);
      // });

      // remove pod affinity defaults
      createClusterPage.clusterAgentConfiguration().podAffinity().removeAllTerms();

      podAffinityData.forEach((podAffinityTermData, i) => {
        createClusterPage.clusterAgentConfiguration().podAffinity().addTerm();
        createClusterPage.clusterAgentConfiguration().podAffinity().editTerm(podAffinityTermData, i);
      });
    });
  });
});
