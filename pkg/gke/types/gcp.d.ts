interface gkeVersionChannel {
  channel: 'RAPID' | 'REGULAR' | 'STABLE',
  defaultVersion: string,
  validVersions: string[]
}

interface gkeNetwork {
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

interface gkeSubnetwork{
  creationTimestamp: string,
  fingerprint: string,
  gatewayAddress: string,
  id: string,
  ipCidrRange: string,
  kind: string,
  name: string,
  network: string,
  privateIpGoogleAccess: boolean,
  purpose: string,
  region: string,
  secondaryIpRanges: {
    ipCidrRange: string,
    rangeName: string
  }[],
  selfLink: string,
  stackType: string
}

export interface getGKEVersionsResponse {
  channels: gkeVersionChannel[],
  defaultClusterVersion: string,
  defaultImageType: string,
  validImageTypes: string[],
  validMasterVersions: string[],
  validNodeVersions: string[]
}

export interface getGKENetworksResponse {
  id: string,
  items: gkeNetwork[],
  kind: string,
  selfLink: string
}

export interface getGKESubnetworksResponse {
  id: string,
  items: gkeSubnetwork[],
  kind: string,
  selfLink: string
}

export interface getGKEClustersResponse {
  clusters: {
    name: string,
    releaseChannel?: {
        channel?:string
      }
  }[]
}
