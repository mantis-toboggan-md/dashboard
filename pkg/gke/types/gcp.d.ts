interface GKEVersionChannel {
  channel: 'RAPID' | 'REGULAR' | 'STABLE',
  defaultVersion: string,
  validVersions: string[]
}

interface GKENetwork {
  autoCreateSubnetworks: boolean,
  creationTimestamp: string,
  id: string,
  kind: string,
  mtu: number,
  name: string,
  networkFirewallPolicyEnforcementOrder: string,
  routingConfig: {
    routingMode: string
  },
  selfLink: string,
selfLinkWIthId: string,
subnetworks: string[]
}

export interface GKESubnetwork{
  creationTimestamp?: string,
  fingerprint?: string,
  gatewayAddress?: string,
  id?: string,
  ipCidrRange: string,
  kind?: string,
  name?: string,
  network: string,
  privateIpGoogleAccess?: boolean,
  purpose?: string,
  region?: string,
  secondaryIpRanges?: {
    ipCidrRange: string,
    rangeName: string,
    status?: string,
  }[],
  selfLink?: string,
  stackType?: string
  subnetwork?: string
}

export interface GKEMachineType {
  creationTimestamp?: string,
  description?: string,
  guestCpus?: number,
  id?: string,
  kind?: string,
  maximumPersistentDisks?: number,
  maximumPersistentDisksSizeGb?: string,
  memoryMb?: number,
  name: string,
  selfLink?: string,
  zone?: string
}

export interface GKEZone {
  availableCpuPlatforms: string[]
  creationTimestamp: string,
  description: string,
  id: string,
  kind: string,
  name: string,
  region: string,
  selfLink: string,
  status: string
}

export interface getGKEVersionsResponse {
  channels: GKEVersionChannel[],
  defaultClusterVersion: string,
  defaultImageType: string,
  validImageTypes: string[],
  validMasterVersions: string[],
  validNodeVersions: string[]
}

export interface getGKENetworksResponse {
  id: string,
  items: GKENetwork[],
  kind: string,
  selfLink: string
}

export interface getGKESubnetworksResponse {
  id: string,
  items: GKESubnetwork[],
  kind: string,
  selfLink: string
}
export interface getGKESharedSubnetworksResponse {
  subnetworks: GKESubnetwork[]
}

export interface getGKEClustersResponse {
  clusters: {
    name: string,
    releaseChannel?: {
        channel?:string
      }
  }[]
}

export interface getGKEMachineTypesResponse {
  items: GKEMachineType[]
}

export interface getGKEZonesResponse {
  items: GKEZone[]
}
