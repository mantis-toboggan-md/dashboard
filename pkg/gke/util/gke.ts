import { addParams, QueryParams } from '@shell/utils/url';

export const DEFAULT_GCP_ZONE = 'us-central1-c';
export const DEFAULT_GCP_REGION = 'us-central1';

// /**
//  *
//  * @param store vuex store used to make the GET request
//  * @param azureCredentialSecret id of an azure cloud credential
//  * @param resourceLocation any valid AKS region
//  * @param clusterId (optional) norman cluster id
//  * @param resource AKS resource to be fetched - one of aksLocations, aksVersions, aksVMSizes, aksVirtualNetworks
//  */
// async function getAKSOptions(store: any, azureCredentialSecret: string, resourceLocation: string, resource: string, clusterId?: string) :Promise<any> {
//   if (!azureCredentialSecret) {
//     return null;
//   }

//   const params: QueryParams = { cloudCredentialId: azureCredentialSecret };

//   if (!!resourceLocation) {
//     params.region = resourceLocation;
//   }
//   if (!!clusterId) {
//     params.clusterId = clusterId;
//   }

//   const url = addParams(`/meta/${ resource }`, params );

//   return store.dispatch('cluster/request', { url });
// }

// /**
//  * Fetch a list of available AKS regions
//  * @param store vuex store used to make the GET request
//  * @param azureCredentialSecret id of an azure cloud credential
//  * @param clusterId (optional) norman cluster id
//  * @returns Array of regions in the form {name, displayName}
//  */

// export async function getAKSRegions(store: Store<any>, azureCredentialSecret: string, clusterId?: string) :Promise<any> {
//   return getAKSOptions(store, azureCredentialSecret, '', 'aksLocations', clusterId );
// }

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
