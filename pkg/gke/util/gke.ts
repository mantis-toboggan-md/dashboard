import { addParams, QueryParams } from '@shell/utils/url';

// If any of these defaults are not available in the actual list from gcp, the ui will default to the first option in the (sorted) list
export const DEFAULT_GCP_ZONE = 'us-central1-c';
export const DEFAULT_GCP_REGION = 'us-central1';

/**
 * @param resource gcp resource to fetch eg gkeZones
 * @param store vuex store used to dispatch management/request
 * @param cloudCredentialId gcp credential id - will be in the form cattle-global-data:<random string>
 * @param projectId gcp project in which to make the request
 * @param zone gcp zone in which to make the request - defaults to DEFAULT_GCP_ZONE if both zone and region are undefined. ignored if region is defined
 * @param region gcp region in which to make the request
 * @returns
 */
function getGKEOptions(resource: string, store: any, cloudCredentialId: string, projectId: string, zone: string|null, region?: string ) {
  if (!cloudCredentialId || !projectId) {
    return null;
  }
  if (!zone && !region) {
    zone = DEFAULT_GCP_ZONE;
  }
  let params: QueryParams;

  if (region) {
    params = {
      cloudCredentialId, projectId, region
    };
  } else if (zone) {
    params = {
      cloudCredentialId, projectId, zone

    };
  }

  const url = addParams(`/meta/${ resource }`, params);

  return store.dispatch('management/request', {
    url,
    method:               'POST',
    redirectUnauthorized: false,
  });
}

export async function getGKEZones(store: any, cloudCredentialId: string, projectId: string, zone: string|null, region?: string): Promise<{items: any[]}> {
  return await getGKEOptions('gkeZones', store, cloudCredentialId, projectId, zone, region);
}

export async function getGKEVersions(store: any, cloudCredentialId: string, projectId: string, zone: string|null, region?: string): Promise<{items: any[]}> {
  return await getGKEOptions('gkeVersions', store, cloudCredentialId, projectId, zone, region);
}

export async function getGKEMachineTypes(store: any, cloudCredentialId: string, projectId: string, zone: string|null, region?: string): Promise<{items: any[]}> {
  return await getGKEOptions('gkeMachineTypes', store, cloudCredentialId, projectId, zone, region);
}

export async function getGKENetworks(store: any, cloudCredentialId: string, projectId: string, zone: string|null, region?: string): Promise<{items: any[]}> {
  return await getGKEOptions('gkeNetworks', store, cloudCredentialId, projectId, zone, region);
}

export async function getGKESubnetworks(store: any, cloudCredentialId: string, projectId: string, zone: string|null, region?: string): Promise<{items: any[]}> {
  return await getGKEOptions('gkeSubnetworks', store, cloudCredentialId, projectId, zone, region);
}

export async function getGKESharedSubnets(store: any, cloudCredentialId: string, projectId: string, zone: string|null, region?: string): Promise<{items: any[]}> {
  return await getGKEOptions('gkeSharedSubnets', store, cloudCredentialId, projectId, zone, region);
}

export async function getGKEServiceAccounts(store: any, cloudCredentialId: string, projectId: string, zone: string|null, region?: string): Promise<{items: any[]}> {
  return await getGKEOptions('gkeServiceAccounts', store, cloudCredentialId, projectId, zone, region);
}
